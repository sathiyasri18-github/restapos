namespace CustomerApi.Domain.Entities;

public class Menu
{
    public int Id { get; set; }
    public int? ParentMenuId { get; set; }
    public string MenuCode { get; set; } = null!;
    public string MenuName { get; set; } = null!;
    public string? RoutePath { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime? CreatedDate { get; set; }
    public int? ModifiedBy { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
