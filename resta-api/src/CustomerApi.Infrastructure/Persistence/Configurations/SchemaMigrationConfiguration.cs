using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class SchemaMigrationConfiguration : IEntityTypeConfiguration<SchemaMigration>
{
    public void Configure(EntityTypeBuilder<SchemaMigration> builder)
    {
        builder.ToTable("SchemaMigration");
        builder.HasKey(x => x.Id).HasName("PK_SchemaMigration");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.MigrationName).HasMaxLength(191);
        builder.Property(x => x.MigrationName).IsRequired();
    }
}
