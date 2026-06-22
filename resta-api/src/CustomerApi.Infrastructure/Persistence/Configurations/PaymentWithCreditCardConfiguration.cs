using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PaymentWithCreditCardConfiguration : IEntityTypeConfiguration<PaymentWithCreditCard>
{
    public void Configure(EntityTypeBuilder<PaymentWithCreditCard> builder)
    {
        builder.ToTable("PaymentWithCreditCard");
        builder.HasKey(x => x.Id).HasName("PK_PaymentWithCreditCard");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.CustomerStripeId).HasMaxLength(191);
        builder.Property(x => x.CustomerStripeId).IsRequired(false);
        builder.Property(x => x.ChargeId).HasMaxLength(191);
        builder.Property(x => x.ChargeId).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithCreditCard_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PaymentWithCreditCard_ModifiedDate");
    }
}
