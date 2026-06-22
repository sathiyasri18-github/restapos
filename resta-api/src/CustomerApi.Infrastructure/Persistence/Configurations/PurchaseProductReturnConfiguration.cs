using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PurchaseProductReturnConfiguration : IEntityTypeConfiguration<PurchaseProductReturn>
{
    public void Configure(EntityTypeBuilder<PurchaseProductReturn> builder)
    {
        builder.ToTable("PurchaseProductReturn");
        builder.HasKey(x => x.Id).HasName("PK_PurchaseProductReturn");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ImeiNumber).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PurchaseProductReturn_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PurchaseProductReturn_ModifiedDate");
    }
}
