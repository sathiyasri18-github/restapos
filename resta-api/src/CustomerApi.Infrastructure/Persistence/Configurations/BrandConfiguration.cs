using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("Brand");
        builder.HasKey(x => x.Id).HasName("PK_Brand");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Title).HasMaxLength(191);
        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.Image).HasMaxLength(191);
        builder.Property(x => x.Image).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Brand_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Brand_ModifiedDate");
    }
}
