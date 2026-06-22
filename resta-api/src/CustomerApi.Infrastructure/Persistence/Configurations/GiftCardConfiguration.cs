using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class GiftCardConfiguration : IEntityTypeConfiguration<GiftCard>
{
    public void Configure(EntityTypeBuilder<GiftCard> builder)
    {
        builder.ToTable("GiftCard");
        builder.HasKey(x => x.Id).HasName("PK_GiftCard");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.CardNo).HasMaxLength(191);
        builder.Property(x => x.CardNo).IsRequired();
        builder.Property(x => x.ExpiredDate).HasColumnType("date");
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_GiftCard_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_GiftCard_ModifiedDate");
    }
}
