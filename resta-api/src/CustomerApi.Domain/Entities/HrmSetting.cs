namespace CustomerApi.Domain.Entities;

public class HrmSetting
{
    public int Id { get; set; }
    public string Checkin { get; set; } = null!;
    public string Checkout { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
