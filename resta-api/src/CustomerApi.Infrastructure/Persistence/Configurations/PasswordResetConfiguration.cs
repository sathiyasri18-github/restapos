using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PasswordResetConfiguration : IEntityTypeConfiguration<PasswordReset>
{
    public void Configure(EntityTypeBuilder<PasswordReset> builder)
    {
        builder.ToTable("PasswordReset");
        builder.HasKey(x => new { x.Email, x.Token }).HasName("PK_PasswordReset");
        builder.Property(x => x.Email).HasMaxLength(191);
        builder.Property(x => x.Email).IsRequired();
        builder.Property(x => x.Token).HasMaxLength(191);
        builder.Property(x => x.Token).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PasswordReset_CreatedDate");
    }
}
