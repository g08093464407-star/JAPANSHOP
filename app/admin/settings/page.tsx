import { Languages, Settings, SlidersHorizontal, Warehouse } from "lucide-react"

const plannedSettings = [
  {
    title: "Операційні параметри",
    description:
      "Сюди варто переносити тільки те, що справді змінюється в роботі магазину.",
    icon: SlidersHorizontal,
  },
  {
    title: "Склад і доставка",
    description:
      "Майбутня зона для складських правил, Smart Box ratio і параметрів пакування.",
    icon: Warehouse,
  },
  {
    title: "Мова адмінки",
    description:
      "Адмінка має лишатися українською, а customer-facing контент японською там, де це дані для покупця.",
    icon: Languages,
  },
]

export default function AdminSettingsPage() {
  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,249,238,0.78)_54%,rgba(240,216,174,0.50))] p-6 shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
              Налаштування
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
              Майбутній центр налаштувань
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
              Це заглушка для операційних налаштувань. Тут поки немає форм, збереження
              або перемикачів, які вдають роботу.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#ead3a6] bg-[#fff7e4] text-[#8a5d18]">
            <Settings className="h-5 w-5" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {plannedSettings.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-[26px] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(58,42,22,0.055)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="sonyachna-admin-eyebrow text-[10px] text-[#a58d68]">
                    Заплановано
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-normal text-neutral-950">
                    {item.title}
                  </h2>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ead3a6] bg-[#fff7e4] text-[#8a5d18]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-500">{item.description}</p>
            </div>
          )
        })}
      </section>

      <section className="rounded-[30px] border border-[#eadfce] bg-white/76 p-6 text-sm leading-7 text-neutral-600 shadow-[0_18px_44px_rgba(58,42,22,0.055)]">
        Налаштування не треба робити смітником. Тут мають бути тільки реальні
        операційні параметри: склад, donation %, Smart Box ratio і мова адмінки.
      </section>
    </div>
  )
}
