using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ReturnPurchaseConfiguration : IEntityTypeConfiguration<ReturnPurchase>
{
    public void Configure(EntityTypeBuilder<ReturnPurchase> builder)
    {
        builder.ToTable("ReturnPurchase");
        builder.HasKey(x => x.Id).HasName("PK_ReturnPurchase");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ReferenceNo).HasMaxLength(191);
        builder.Property(x => x.ReferenceNo).IsRequired();
        builder.Property(x => x.Document).HasMaxLength(191);
        builder.Property(x => x.Document).IsRequired(false);
        builder.Property(x => x.ReturnNote).IsRequired(false);
        builder.Property(x => x.StaffNote).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ReturnPurchase_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ReturnPurchase_ModifiedDate");
    }
}
