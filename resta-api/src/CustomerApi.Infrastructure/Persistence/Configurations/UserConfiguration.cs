using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("User");
        builder.HasKey(x => x.Id).HasName("PK_User");
        builder.Property(x => x.Id).UseIdentityColumn();

        builder.Property(x => x.UserName).HasColumnName("Name").HasMaxLength(191).IsRequired();
        builder.Property(x => x.NormalizedUserName).HasMaxLength(191);
        builder.Property(x => x.Email).HasMaxLength(191).IsRequired();
        builder.Property(x => x.NormalizedEmail).HasMaxLength(191);
        builder.Property(x => x.PasswordHash).HasColumnName("Password").HasMaxLength(191).IsRequired();
        builder.Property(x => x.PhoneNumber).HasColumnName("Phone").HasMaxLength(191).IsRequired();
        builder.Property(x => x.SecurityStamp).HasMaxLength(256);
        builder.Property(x => x.ConcurrencyStamp).HasMaxLength(256);

        builder.Property(x => x.RememberToken).HasMaxLength(100);
        builder.Property(x => x.RememberToken).IsRequired(false);
        builder.Property(x => x.CompanyName).HasMaxLength(191);
        builder.Property(x => x.CompanyName).IsRequired(false);

        builder.HasOne(x => x.Role)
            .WithMany()
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_User_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_User_ModifiedDate");
    }
}
