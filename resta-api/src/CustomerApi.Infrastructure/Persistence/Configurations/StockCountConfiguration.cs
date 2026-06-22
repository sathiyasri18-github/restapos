using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class StockCountConfiguration : IEntityTypeConfiguration<StockCount>
{
    public void Configure(EntityTypeBuilder<StockCount> builder)
    {
        builder.ToTable("StockCount");
        builder.HasKey(x => x.Id).HasName("PK_StockCount");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ReferenceNo).HasMaxLength(191);
        builder.Property(x => x.ReferenceNo).IsRequired();
        builder.Property(x => x.CategoryId).HasMaxLength(191);
        builder.Property(x => x.CategoryId).IsRequired(false);
        builder.Property(x => x.BrandId).HasMaxLength(191);
        builder.Property(x => x.BrandId).IsRequired(false);
        builder.Property(x => x.Type).HasMaxLength(191);
        builder.Property(x => x.Type).IsRequired();
        builder.Property(x => x.InitialFile).HasMaxLength(191);
        builder.Property(x => x.InitialFile).IsRequired(false);
        builder.Property(x => x.FinalFile).HasMaxLength(191);
        builder.Property(x => x.FinalFile).IsRequired(false);
        builder.Property(x => x.Note).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_StockCount_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_StockCount_ModifiedDate");
    }
}
