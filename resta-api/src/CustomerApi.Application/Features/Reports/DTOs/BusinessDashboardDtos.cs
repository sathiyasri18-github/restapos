namespace CustomerApi.Application.Features.Reports.DTOs;

public class DashboardMetricDto
{
    public int Count { get; set; }
    public double Amount { get; set; }
}

public class BusinessDashboardSummaryDto
{
    public DashboardMetricDto Sales { get; set; } = new();
    public DashboardMetricDto Purchases { get; set; } = new();
    public DashboardMetricDto SalesReturns { get; set; } = new();
    public DashboardMetricDto PurchaseReturns { get; set; } = new();
    public DashboardMetricDto Expenses { get; set; } = new();
    public double NetSales { get; set; }
    public double NetPurchases { get; set; }
    public double NetPosition { get; set; }
}

public class DailyTrendItemDto
{
    public string Date { get; set; } = null!;
    public double SalesAmount { get; set; }
    public int SalesCount { get; set; }
    public double PurchaseAmount { get; set; }
    public int PurchaseCount { get; set; }
    public double ExpenseAmount { get; set; }
    public int ExpenseCount { get; set; }
}

public class ExpenseCategorySummaryDto
{
    public string CategoryName { get; set; } = null!;
    public int Count { get; set; }
    public double Amount { get; set; }
}

public class BusinessDashboardDto
{
    public string FromDate { get; set; } = null!;
    public string ToDate { get; set; } = null!;
    public BusinessDashboardSummaryDto Summary { get; set; } = new();
    public List<DailyTrendItemDto> DailyTrend { get; set; } = [];
    public List<ExpenseCategorySummaryDto> ExpenseByCategory { get; set; } = [];
}
