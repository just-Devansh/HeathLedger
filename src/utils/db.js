import Dexie from 'dexie'

export const db = new Dexie('HeathLedgerDB')

db.version(1).stores({
  expenses:       'id, date, categoryId',
  categories:     'id',
  recurringRules: 'id',
  settings:       'key',
})

db.version(2).stores({
  expenses: 'id, date, categoryId, tripId',
  trips:    'id, startDate',
})
