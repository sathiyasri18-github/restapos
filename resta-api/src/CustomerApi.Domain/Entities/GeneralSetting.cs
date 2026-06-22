namespace CustomerApi.Domain.Entities;

public class GeneralSetting
{
    public int Id { get; set; }
    public string SiteTitle { get; set; } = null!;
    public string? SiteLogo { get; set; }
    public bool? IsRtl { get; set; }
    public string Currency { get; set; } = null!;
    public string StaffAccess { get; set; } = null!;
    public string DateFormat { get; set; } = null!;
    public string? DevelopedBy { get; set; }
    public string? InvoiceFormat { get; set; }
    public int? State { get; set; }
    public string Theme { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public string CurrencyPosition { get; set; } = null!;
}
