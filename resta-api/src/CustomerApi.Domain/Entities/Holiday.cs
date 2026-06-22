namespace CustomerApi.Domain.Entities;

public class Holiday
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public string? Note { get; set; }
    public bool IsApproved { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
