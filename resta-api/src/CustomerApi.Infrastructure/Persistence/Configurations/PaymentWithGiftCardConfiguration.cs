using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PaymentWithGiftCardConfiguration : IEntityTypeConfiguration<PaymentWithGiftCard>
{
    public void Configure(EntityTypeBuilder<PaymentWithGiftCard> builder)
    {
        builder.ToTable("PaymentWithGiftCard");
        builder.HasKey(x => x.Id).HasName("PK_PaymentWithGiftCard");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithGiftCard_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithGiftCard_ModifiedDate");
    }
}
