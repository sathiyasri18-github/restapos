using Asp.Versioning;
using CustomerApi.Application.Features.Reports.DTOs;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/Reports")]
public class ReportsController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet("business-dashboard")]
    [ProducesResponseType(typeof(BusinessDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBusinessDashboard(
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        toDate ??= today;
        fromDate ??= new DateOnly(toDate.Value.Year, toDate.Value.Month, 1);

        if (fromDate > toDate)
            (fromDate, toDate) = (toDate, fromDate);

        var fromDateTime = fromDate.Value.ToDateTime(TimeOnly.MinValue);
        var toDateTime = toDate.Value.ToDateTime(new TimeOnly(23, 59, 59, 999));

        var sales = await db.Sales.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Amount = g.Sum(x => x.GrandTotal) })
            .FirstOrDefaultAsync(ct) ?? new { Count = 0, Amount = 0.0 };

        var purchases = await db.Purchases.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Amount = g.Sum(x => x.GrandTotal) })
            .FirstOrDefaultAsync(ct) ?? new { Count = 0, Amount = 0.0 };

        var salesReturns = await db.SaleReturns.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Amount = g.Sum(x => x.GrandTotal) })
            .FirstOrDefaultAsync(ct) ?? new { Count = 0, Amount = 0.0 };

        var purchaseReturns = await db.ReturnPurchases.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Amount = g.Sum(x => x.GrandTotal) })
            .FirstOrDefaultAsync(ct) ?? new { Count = 0, Amount = 0.0 };

        var expenses = await db.Expenses.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Amount = g.Sum(x => x.Amount) })
            .FirstOrDefaultAsync(ct) ?? new { Count = 0, Amount = 0.0 };

        var netSales = sales.Amount - salesReturns.Amount;
        var netPurchases = purchases.Amount - purchaseReturns.Amount;
        var netPosition = netSales - netPurchases - expenses.Amount;

        var salesDaily = await db.Sales.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(x => x.CreatedDate!.Value.Date)
            .Select(g => new { Date = g.Key, Count = g.Count(), Amount = g.Sum(x => x.GrandTotal) })
            .ToListAsync(ct);

        var purchaseDaily = await db.Purchases.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(x => x.CreatedDate!.Value.Date)
            .Select(g => new { Date = g.Key, Count = g.Count(), Amount = g.Sum(x => x.GrandTotal) })
            .ToListAsync(ct);

        var expenseDaily = await db.Expenses.AsNoTracking()
            .Where(x => x.CreatedDate >= fromDateTime && x.CreatedDate <= toDateTime)
            .GroupBy(x => x.CreatedDate!.Value.Date)
            .Select(g => new { Date = g.Key, Count = g.Count(), Amount = g.Sum(x => x.Amount) })
            .ToListAsync(ct);

        var trendMap = new Dictionary<DateTime, DailyTrendItemDto>();

        void MergeDaily(IEnumerable<(DateTime Date, int Count, double Amount)> items, Action<DailyTrendItemDto, int, double> apply)
        {
            foreach (var item in items)
            {
                if (!trendMap.TryGetValue(item.Date, out var row))
                {
                    row = new DailyTrendItemDto { Date = item.Date.ToString("yyyy-MM-dd") };
                    trendMap[item.Date] = row;
                }
                apply(row, item.Count, item.Amount);
            }
        }

        MergeDaily(salesDaily.Select(x => (x.Date, x.Count, x.Amount)), (r, c, a) => { r.SalesCount = c; r.SalesAmount = a; });
        MergeDaily(purchaseDaily.Select(x => (x.Date, x.Count, x.Amount)), (r, c, a) => { r.PurchaseCount = c; r.PurchaseAmount = a; });
        MergeDaily(expenseDaily.Select(x => (x.Date, x.Count, x.Amount)), (r, c, a) => { r.ExpenseCount = c; r.ExpenseAmount = a; });

        var expenseByCategory = await (
            from e in db.Expenses.AsNoTracking()
            join c in db.ExpenseCategorys.AsNoTracking() on e.ExpenseCategoryId equals c.Id into cats
            from c in cats.DefaultIfEmpty()
            where e.CreatedDate >= fromDateTime && e.CreatedDate <= toDateTime
            group e by (c != null ? c.Name : "Uncategorized") into g
            orderby g.Sum(x => x.Amount) descending
            select new ExpenseCategorySummaryDto
            {
                CategoryName = g.Key,
                Count = g.Count(),
                Amount = g.Sum(x => x.Amount),
            }).ToListAsync(ct);

        return Ok(new BusinessDashboardDto
        {
            FromDate = fromDate.Value.ToString("yyyy-MM-dd"),
            ToDate = toDate.Value.ToString("yyyy-MM-dd"),
            Summary = new BusinessDashboardSummaryDto
            {
                Sales = new DashboardMetricDto { Count = sales.Count, Amount = sales.Amount },
                Purchases = new DashboardMetricDto { Count = purchases.Count, Amount = purchases.Amount },
                SalesReturns = new DashboardMetricDto { Count = salesReturns.Count, Amount = salesReturns.Amount },
                PurchaseReturns = new DashboardMetricDto { Count = purchaseReturns.Count, Amount = purchaseReturns.Amount },
                Expenses = new DashboardMetricDto { Count = expenses.Count, Amount = expenses.Amount },
                NetSales = netSales,
                NetPurchases = netPurchases,
                NetPosition = netPosition,
            },
            DailyTrend = trendMap.Values.OrderBy(x => x.Date).ToList(),
            ExpenseByCategory = expenseByCategory,
        });
    }
}
