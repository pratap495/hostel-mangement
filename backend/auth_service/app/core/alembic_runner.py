import os
import alembic.config
import alembic.command

def run_tenant_migrations(db_connection_url: str):
    """Programmatically upgrade tenant database to the latest schema using Alembic."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ini_path = os.path.join(base_dir, "alembic.ini")
    
    alembic_cfg = alembic.config.Config(ini_path)
    alembic_cfg.set_main_option("sqlalchemy.url", db_connection_url)
    
    # Point to the tenant migration scripts directory
    alembic_cfg.set_main_option("script_location", os.path.join(base_dir, "alembic"))
    
    alembic.command.upgrade(alembic_cfg, "head")
