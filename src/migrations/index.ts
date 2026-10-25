import * as migration_20261022_163814_initial from './20261022_163814_initial'
import * as migration_20251025_add_joomla_mediablock_fields from './20251025_add_joomla_mediablock_fields'

export const migrations = [
  {
    up: migration_20261022_163814_initial.up,
    down: migration_20261022_163814_initial.down,
    name: '20261022_163814_initial',
  },
  {
    up: migration_20251025_add_joomla_mediablock_fields.up,
    down: migration_20251025_add_joomla_mediablock_fields.down,
    name: '20251025_add_joomla_mediablock_fields',
  },
]
