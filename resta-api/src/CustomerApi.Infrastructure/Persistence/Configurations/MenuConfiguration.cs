using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class MenuConfiguration : IEntityTypeConfiguration<Menu>
{
    public void Configure(EntityTypeBuilder<Menu> builder)
    {
        builder.ToTable("Menu");
        builder.HasKey(x => x.Id).HasName("PK_Menu");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.MenuCode).HasMaxLength(50).IsRequired();
        builder.Property(x => x.MenuName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.RoutePath).HasMaxLength(200);
        builder.Property(x => x.Icon).HasMaxLength(50);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Menu_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Menu_ModifiedDate");
    }
}
