using CustomerApi.Domain.Entities;

namespace CustomerApi.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user, IEnumerable<string> roleNames);
    DateTime GetExpiresAt();
}
