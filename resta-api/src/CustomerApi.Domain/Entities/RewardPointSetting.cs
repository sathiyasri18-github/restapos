namespace CustomerApi.Domain.Entities;

public class RewardPointSetting
{
    public long Id { get; set; }
    public double PerPointAmount { get; set; }
    public double MinimumAmount { get; set; }
    public int? Duration { get; set; }
    public string? Type { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
