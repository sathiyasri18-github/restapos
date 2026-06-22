namespace CustomerApi.Domain.Entities;

public class Attendance
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public int EmployeeId { get; set; }
    public int UserId { get; set; }
    public string Checkin { get; set; } = null!;
    public string Checkout { get; set; } = null!;
    public int Status { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
