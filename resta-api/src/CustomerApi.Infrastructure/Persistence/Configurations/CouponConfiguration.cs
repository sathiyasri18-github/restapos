using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.ToTable("Coupon");
        builder.HasKey(x => x.Id).HasName("PK_Coupon");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Code).HasMaxLength(191);
        builder.Property(x => x.Code).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(191);
        builder.Property(x => x.Type).IsRequired();
        builder.Property(x => x.ExpiredDate).HasColumnType("date");
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Coupon_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Coupon_ModifiedDate");
    }
}
