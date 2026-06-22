namespace CustomerApi.Domain.Entities;

public class SchemaMigration
{
    public int Id { get; set; }
    public string MigrationName { get; set; } = null!;
    public int Batch { get; set; }
}
