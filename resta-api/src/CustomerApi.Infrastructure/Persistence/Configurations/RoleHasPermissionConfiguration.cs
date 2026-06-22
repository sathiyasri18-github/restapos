using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class RoleHasPermissionConfiguration : IEntityTypeConfiguration<RoleHasPermission>
{
    public void Configure(EntityTypeBuilder<RoleHasPermission> builder)
    {
        builder.ToTable("RoleHasPermission");
        builder.HasKey(x => new { x.PermissionId, x.RoleId }).HasName("PK_RoleHasPermission");
    }
}
