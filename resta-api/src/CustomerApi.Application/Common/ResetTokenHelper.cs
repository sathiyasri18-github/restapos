using System.Security.Cryptography;
using System.Text;

namespace CustomerApi.Application.Common;

public static class ResetTokenHelper
{
    public static string GeneratePlainToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

    public static string HashToken(string plainToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plainToken));
        return Convert.ToBase64String(bytes);
    }
}
