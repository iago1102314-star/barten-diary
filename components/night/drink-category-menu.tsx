"use client";

import {
  DRINK_CATEGORIES,
  MASTER_DELEGATE_CATEGORY_ID,
  type DrinkCategory,
  type DrinkCategoryId,
} from "@/lib/drinks/drink-catalog";

type DrinkCategoryMenuProps = {
  selectedId: DrinkCategoryId | null;
  onSelect: (id: DrinkCategoryId) => void;
};

function MenuItem({
  category,
  selected,
  onSelect,
}: {
  category: DrinkCategory;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-amber-800/50 bg-amber-950/40"
          : "border-stone-800/80 bg-stone-950/30 hover:border-stone-700/80"
      }`}
    >
      <p
        className={`text-sm tracking-wide ${
          selected ? "text-amber-100/90" : "text-stone-300"
        }`}
      >
        {category.label}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-stone-500">
        {category.description}
      </p>
    </button>
  );
}

export function DrinkCategoryMenu({
  selectedId,
  onSelect,
}: DrinkCategoryMenuProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs tracking-[0.25em] text-stone-600 uppercase">
        今夜のメニュー
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {DRINK_CATEGORIES.map((category) => (
          <MenuItem
            key={category.id}
            category={category}
            selected={selectedId === category.id}
            onSelect={() => onSelect(category.id)}
          />
        ))}
      </div>
      {selectedId && (
        <p className="text-center text-xs text-stone-500">
          {selectedId === MASTER_DELEGATE_CATEGORY_ID
            ? "マスターが、今夜の一杯を選びます。"
            : "マスターが、一杯選びます。"}
        </p>
      )}
    </div>
  );
}
