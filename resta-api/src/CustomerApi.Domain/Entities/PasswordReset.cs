namespace CustomerApi.Domain.Entities;

public class PasswordReset
{
    public string Email { get; set; } = null!;
    public string Token { get; set; } = null!;
    public DateTime? CreatedDate { get; set; }
}
