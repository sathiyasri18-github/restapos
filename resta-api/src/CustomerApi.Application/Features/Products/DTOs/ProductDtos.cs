namespace CustomerApi.Application.Features.Products.DTOs;

public class ProductDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string BarcodeSymbology { get; set; } = null!;
    public int? BrandId { get; set; }
    public int CategoryId { get; set; }
    public int UnitId { get; set; }
    public int PurchaseUnitId { get; set; }
    public int SaleUnitId { get; set; }
    public string Cost { get; set; } = null!;
    public string Price { get; set; } = null!;
    public double? Qty { get; set; }
    public double? AlertQuantity { get; set; }
    public int? Promotion { get; set; }
    public string? PromotionPrice { get; set; }
    public string? StartingDate { get; set; }
    public DateOnly? LastDate { get; set; }
    public int? TaxId { get; set; }
    public int? TaxMethod { get; set; }
    public string? Image { get; set; }
    public string? File { get; set; }
    public bool? IsVariant { get; set; }
    public bool? IsBatch { get; set; }
    public bool? IsDiffprice { get; set; }
    public bool? IsImei { get; set; }
    public int? Featured { get; set; }
    public string? ProductList { get; set; }
    public string? VariantList { get; set; }
    public string? QtyList { get; set; }
    public string? PriceList { get; set; }
    public string? ProductDetails { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }

    // Legacy frontend fields (mapped from Product entity)
    public string? Description { get; set; }
    public double? SaleProductCost { get; set; }
    public double? PurchaseProductCost { get; set; }
    public int? Unit { get; set; }
    public string? UnitName { get; set; }
    public double? Discount { get; set; }
    public int? Quantity { get; set; }
    public double? Gst { get; set; }
    public double? Cgst { get; set; }
    public double? Sgst { get; set; }
    public string? TamilName { get; set; }
    public double? MinQuantity { get; set; }
    public string? Hsn { get; set; }
}

public class CreateProductRequest
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Type { get; set; }
    public string? BarcodeSymbology { get; set; }
    public int? BrandId { get; set; }
    public int? CategoryId { get; set; }
    public int? UnitId { get; set; }
    public int? PurchaseUnitId { get; set; }
    public int? SaleUnitId { get; set; }
    public string? Cost { get; set; }
    public string? Price { get; set; }
    public double? Qty { get; set; }
    public double? AlertQuantity { get; set; }
    public int? Promotion { get; set; }
    public string? PromotionPrice { get; set; }
    public string? StartingDate { get; set; }
    public DateOnly? LastDate { get; set; }
    public int? TaxId { get; set; }
    public int? TaxMethod { get; set; }
    public string? Image { get; set; }
    public string? File { get; set; }
    public bool? IsVariant { get; set; }
    public bool? IsBatch { get; set; }
    public bool? IsDiffprice { get; set; }
    public bool? IsImei { get; set; }
    public int? Featured { get; set; }
    public string? ProductList { get; set; }
    public string? VariantList { get; set; }
    public string? QtyList { get; set; }
    public string? PriceList { get; set; }
    public string? ProductDetails { get; set; }
    public bool? IsActive { get; set; }

    // Legacy frontend fields
    public string? Description { get; set; }
    public double? SaleProductCost { get; set; }
    public double? PurchaseProductCost { get; set; }
    public int? Unit { get; set; }
    public double? Discount { get; set; }
    public int? Quantity { get; set; }
    public double? Gst { get; set; }
    public double? Cgst { get; set; }
    public double? Sgst { get; set; }
    public string? TamilName { get; set; }
    public double? MinQuantity { get; set; }
    public string? Hsn { get; set; }
    public int? CreatedBy { get; set; }
}

public class UpdateProductRequest : CreateProductRequest
{
    public int? ModifiedBy { get; set; }
}
