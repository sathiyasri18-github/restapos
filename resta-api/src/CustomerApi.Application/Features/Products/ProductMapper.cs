using CustomerApi.Application.Features.Products.DTOs;
using CustomerApi.Domain.Entities;

namespace CustomerApi.Application.Features.Products;

public static class ProductMapper
{
    public static ProductDto ToDto(Product entity, string? unitName = null, double? taxRate = null)
    {
        var saleCost = ParseAmount(entity.Price);
        var purchaseCost = ParseAmount(entity.Cost);

        return new ProductDto
        {
            ProductId = entity.Id,
            Name = entity.Name,
            Code = entity.Code,
            Type = entity.Type,
            BarcodeSymbology = entity.BarcodeSymbology,
            BrandId = entity.BrandId,
            CategoryId = entity.CategoryId,
            UnitId = entity.UnitId,
            PurchaseUnitId = entity.PurchaseUnitId,
            SaleUnitId = entity.SaleUnitId,
            Cost = entity.Cost,
            Price = entity.Price,
            Qty = entity.Qty,
            AlertQuantity = entity.AlertQuantity,
            Promotion = entity.Promotion,
            PromotionPrice = entity.PromotionPrice,
            StartingDate = entity.StartingDate,
            LastDate = entity.LastDate,
            TaxId = entity.TaxId,
            TaxMethod = entity.TaxMethod,
            Image = entity.Image,
            File = entity.File,
            IsVariant = entity.IsVariant,
            IsBatch = entity.IsBatch,
            IsDiffprice = entity.IsDiffprice,
            IsImei = entity.IsImei,
            Featured = entity.Featured,
            ProductList = entity.ProductList,
            VariantList = entity.VariantList,
            QtyList = entity.QtyList,
            PriceList = entity.PriceList,
            ProductDetails = entity.ProductDetails,
            IsActive = entity.IsActive,
            CreatedDate = entity.CreatedDate,
            ModifiedDate = entity.ModifiedDate,
            Description = entity.ProductDetails,
            SaleProductCost = saleCost,
            PurchaseProductCost = purchaseCost,
            Unit = entity.UnitId,
            UnitName = unitName,
            Quantity = entity.Qty.HasValue ? (int?)Math.Round(entity.Qty.Value) : null,
            MinQuantity = entity.AlertQuantity,
            Gst = taxRate,
            Cgst = taxRate.HasValue ? taxRate / 2 : null,
            Sgst = taxRate.HasValue ? taxRate / 2 : null,
        };
    }

    public static Product ToEntity(CreateProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Product name is required.", nameof(request));

        var unitId = request.UnitId ?? request.Unit ?? 1;
        var purchaseUnitId = request.PurchaseUnitId ?? unitId;
        var saleUnitId = request.SaleUnitId ?? unitId;
        var cost = ResolveAmountString(request.Cost, request.PurchaseProductCost, "0");
        var price = ResolveAmountString(request.Price, request.SaleProductCost, "0");

        return new Product
        {
            Name = request.Name.Trim(),
            Code = ResolveCode(request),
            Type = string.IsNullOrWhiteSpace(request.Type) ? "standard" : request.Type.Trim(),
            BarcodeSymbology = string.IsNullOrWhiteSpace(request.BarcodeSymbology)
                ? "C128"
                : request.BarcodeSymbology.Trim(),
            BrandId = request.BrandId,
            CategoryId = request.CategoryId ?? 1,
            UnitId = unitId,
            PurchaseUnitId = purchaseUnitId,
            SaleUnitId = saleUnitId,
            Cost = cost,
            Price = price,
            Qty = request.Qty ?? request.Quantity,
            AlertQuantity = request.AlertQuantity ?? request.MinQuantity,
            Promotion = request.Promotion,
            PromotionPrice = request.PromotionPrice,
            StartingDate = request.StartingDate,
            LastDate = request.LastDate,
            TaxId = request.TaxId,
            TaxMethod = request.TaxMethod,
            Image = request.Image,
            File = request.File,
            IsVariant = request.IsVariant ?? false,
            IsBatch = request.IsBatch ?? false,
            IsDiffprice = request.IsDiffprice ?? false,
            IsImei = request.IsImei ?? false,
            Featured = request.Featured,
            ProductList = request.ProductList,
            VariantList = request.VariantList,
            QtyList = request.QtyList,
            PriceList = request.PriceList,
            ProductDetails = request.ProductDetails ?? request.Description,
            IsActive = request.IsActive ?? true,
        };
    }

    public static void ApplyUpdate(Product entity, UpdateProductRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Name))
            entity.Name = request.Name.Trim();

        if (!string.IsNullOrWhiteSpace(request.Code))
            entity.Code = request.Code.Trim();

        if (!string.IsNullOrWhiteSpace(request.Type))
            entity.Type = request.Type.Trim();

        if (!string.IsNullOrWhiteSpace(request.BarcodeSymbology))
            entity.BarcodeSymbology = request.BarcodeSymbology.Trim();

        if (request.BrandId.HasValue)
            entity.BrandId = request.BrandId;

        if (request.CategoryId.HasValue)
            entity.CategoryId = request.CategoryId.Value;

        var unitId = request.UnitId ?? request.Unit;
        if (unitId.HasValue)
        {
            entity.UnitId = unitId.Value;
            if (!request.PurchaseUnitId.HasValue)
                entity.PurchaseUnitId = unitId.Value;
            if (!request.SaleUnitId.HasValue)
                entity.SaleUnitId = unitId.Value;
        }

        if (request.PurchaseUnitId.HasValue)
            entity.PurchaseUnitId = request.PurchaseUnitId.Value;

        if (request.SaleUnitId.HasValue)
            entity.SaleUnitId = request.SaleUnitId.Value;

        if (!string.IsNullOrWhiteSpace(request.Cost) || request.PurchaseProductCost.HasValue)
            entity.Cost = ResolveAmountString(request.Cost, request.PurchaseProductCost, entity.Cost);

        if (!string.IsNullOrWhiteSpace(request.Price) || request.SaleProductCost.HasValue)
            entity.Price = ResolveAmountString(request.Price, request.SaleProductCost, entity.Price);

        if (request.Qty.HasValue || request.Quantity.HasValue)
            entity.Qty = request.Qty ?? request.Quantity;

        if (request.AlertQuantity.HasValue || request.MinQuantity.HasValue)
            entity.AlertQuantity = request.AlertQuantity ?? request.MinQuantity;

        if (request.Promotion.HasValue)
            entity.Promotion = request.Promotion;

        if (request.PromotionPrice is not null)
            entity.PromotionPrice = request.PromotionPrice;

        if (request.StartingDate is not null)
            entity.StartingDate = request.StartingDate;

        if (request.LastDate.HasValue)
            entity.LastDate = request.LastDate;

        if (request.TaxId.HasValue)
            entity.TaxId = request.TaxId;

        if (request.TaxMethod.HasValue)
            entity.TaxMethod = request.TaxMethod;

        if (request.Image is not null)
            entity.Image = request.Image;

        if (request.File is not null)
            entity.File = request.File;

        if (request.IsVariant.HasValue)
            entity.IsVariant = request.IsVariant;

        if (request.IsBatch.HasValue)
            entity.IsBatch = request.IsBatch;

        if (request.IsDiffprice.HasValue)
            entity.IsDiffprice = request.IsDiffprice;

        if (request.IsImei.HasValue)
            entity.IsImei = request.IsImei;

        if (request.Featured.HasValue)
            entity.Featured = request.Featured;

        if (request.ProductList is not null)
            entity.ProductList = request.ProductList;

        if (request.VariantList is not null)
            entity.VariantList = request.VariantList;

        if (request.QtyList is not null)
            entity.QtyList = request.QtyList;

        if (request.PriceList is not null)
            entity.PriceList = request.PriceList;

        if (request.ProductDetails is not null || request.Description is not null)
            entity.ProductDetails = request.ProductDetails ?? request.Description;

        if (request.IsActive.HasValue)
            entity.IsActive = request.IsActive;
    }

    private static string ResolveCode(CreateProductRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Code))
            return request.Code.Trim();

        var slug = new string(request.Name!
            .Trim()
            .ToUpperInvariant()
            .Where(c => char.IsLetterOrDigit(c))
            .Take(8)
            .ToArray());

        if (string.IsNullOrEmpty(slug))
            slug = "PROD";

        return $"{slug}-{DateTime.UtcNow:yyyyMMddHHmmss}";
    }

    private static string ResolveAmountString(string? raw, double? numeric, string fallback)
    {
        if (!string.IsNullOrWhiteSpace(raw))
            return raw.Trim();

        if (numeric.HasValue)
            return numeric.Value.ToString("0.##");

        return fallback;
    }

    private static double? ParseAmount(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return double.TryParse(value, out var parsed) ? parsed : null;
    }
}
