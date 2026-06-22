namespace CustomerApi.Domain.Entities;

public class ProductUnit
{
    public int Id { get; set; }
    public string UnitCode { get; set; } = null!;
    public string UnitName { get; set; } = null!;
    public int? BaseUnit { get; set; }
    public string? Operator { get; set; }
    public double? OperationValue { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
