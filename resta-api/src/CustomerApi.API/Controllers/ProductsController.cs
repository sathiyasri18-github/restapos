using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Application.Features.Products;
using CustomerApi.Application.Features.Products.DTOs;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/Products")]
public class ProductsController(
    ApplicationDbContext db,
    IGenericRepository<Product> repository,
    IProductImageStorage imageStorage) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = db.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p =>
                p.Name.Contains(term) ||
                p.Code.Contains(term) ||
                (p.ProductDetails != null && p.ProductDetails.Contains(term)));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(p => p.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var unitNames = await LoadUnitNamesAsync(items, ct);
        var taxRates = await LoadTaxRatesAsync(items, ct);

        var dtos = items
            .Select(p => ProductMapper.ToDto(
                p,
                unitNames.GetValueOrDefault(p.UnitId),
                p.TaxId.HasValue ? taxRates.GetValueOrDefault(p.TaxId.Value) : null))
            .ToList();

        return Ok(new PagedResult<ProductDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null)
            return NotFound();

        var unitName = await db.ProductUnits
            .AsNoTracking()
            .Where(u => u.Id == product.UnitId)
            .Select(u => u.UnitName)
            .FirstOrDefaultAsync(ct);

        double? taxRate = null;
        if (product.TaxId.HasValue)
        {
            taxRate = await db.Taxs
                .AsNoTracking()
                .Where(t => t.Id == product.TaxId.Value)
                .Select(t => (double?)t.Rate)
                .FirstOrDefaultAsync(ct);
        }

        return Ok(ProductMapper.ToDto(product, unitName, taxRate));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Product name is required." });

        Product entity;
        try
        {
            entity = ProductMapper.ToEntity(request);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        entity.CreatedDate = DateTime.UtcNow;
        entity.ModifiedDate = DateTime.UtcNow;

        var created = await repository.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ProductMapper.ToDto(created));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        ProductMapper.ApplyUpdate(entity, request);
        entity.ModifiedDate = DateTime.UtcNow;

        var updated = await repository.UpdateAsync(entity, ct);
        return Ok(ProductMapper.ToDto(updated));
    }

    [HttpPost("{id:int}/image")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadImage(int id, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Image file is required." });

        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        try
        {
            await imageStorage.DeleteProductImageAsync(entity.Image, ct);

            await using var stream = file.OpenReadStream();
            entity.Image = await imageStorage.SaveProductImageAsync(
                id,
                stream,
                file.FileName,
                file.ContentType,
                ct);
            entity.ModifiedDate = DateTime.UtcNow;

            await repository.UpdateAsync(entity, ct);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        return Ok(await MapProductDtoAsync(entity, ct));
    }

    [HttpDelete("{id:int}/image")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteImage(int id, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        await imageStorage.DeleteProductImageAsync(entity.Image, ct);
        entity.Image = null;
        entity.ModifiedDate = DateTime.UtcNow;
        await repository.UpdateAsync(entity, ct);

        return Ok(await MapProductDtoAsync(entity, ct));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        await imageStorage.DeleteProductImageAsync(entity.Image, ct);

        var deleted = await repository.DeleteByIdAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    private async Task<ProductDto> MapProductDtoAsync(Product entity, CancellationToken ct)
    {
        var unitName = await db.ProductUnits
            .AsNoTracking()
            .Where(u => u.Id == entity.UnitId)
            .Select(u => u.UnitName)
            .FirstOrDefaultAsync(ct);

        double? taxRate = null;
        if (entity.TaxId.HasValue)
        {
            taxRate = await db.Taxs
                .AsNoTracking()
                .Where(t => t.Id == entity.TaxId.Value)
                .Select(t => (double?)t.Rate)
                .FirstOrDefaultAsync(ct);
        }

        return ProductMapper.ToDto(entity, unitName, taxRate);
    }

    private async Task<Dictionary<int, string>> LoadUnitNamesAsync(IReadOnlyList<Product> products, CancellationToken ct)
    {
        var unitIds = products.Select(p => p.UnitId).Distinct().ToList();
        if (unitIds.Count == 0)
            return new Dictionary<int, string>();

        return await db.ProductUnits
            .AsNoTracking()
            .Where(u => unitIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UnitName, ct);
    }

    private async Task<Dictionary<int, double>> LoadTaxRatesAsync(IReadOnlyList<Product> products, CancellationToken ct)
    {
        var taxIds = products.Where(p => p.TaxId.HasValue).Select(p => p.TaxId!.Value).Distinct().ToList();
        if (taxIds.Count == 0)
            return new Dictionary<int, double>();

        return await db.Taxs
            .AsNoTracking()
            .Where(t => taxIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Rate, ct);
    }
}
