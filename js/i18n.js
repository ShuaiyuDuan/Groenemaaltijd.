/* i18n.js — English/Chinese UI strings + tiny translation helper.
   Language choice is a UI preference, not app data, so it lives in its
   own localStorage key rather than inside gm.v1. */

const KEY = 'gm.lang';

const STRINGS = {
  en: {
    nav_summary: 'Summary', nav_food: 'Food', nav_weight: 'Weight', nav_settings: 'Settings',

    summary_title: 'Summary',
    prev_day: 'Previous day', next_day: 'Next day', close: 'Close', add_food_fab: 'Add food',
    today: 'Today', yesterday: 'Yesterday',
    workout_day: 'Workout day', workout_hint: 'Switches to your training targets',
    burned: 'Burned', eaten: 'Eaten', deficit: 'Deficit',
    ring_calories: 'Calories', ring_protein: 'Protein', ring_carbs: 'Carbs', ring_fat: 'Fat',
    ring_over: '{{n}} {{unit}} over', ring_left: '{{n}} {{unit}} left', ring_of: 'of {{n}} {{unit}}',
    notice_macro_mismatch: 'Your macro targets add up to <strong>{{implied}} kcal</strong>, but your intake target is <strong>{{target}}</strong> ({{gap}}). Adjust either in Settings, or turn on “Carbs fill the gap”.',

    food_title: 'Food tracker',
    meal_breakfast: 'Breakfast', meal_lunch: 'Lunch', meal_dinner: 'Dinner', meal_snacks: 'Snacks',
    add_another: '+ Add another', nothing_logged: 'Nothing logged — tap to add',
    fav_label: 'Favourite', delete_label: 'Delete',
    confirm_delete_entry: 'Delete this entry?',

    modal_add_food: 'Add food', modal_edit_food: 'Edit food',
    name_search_label: 'Name — keep typing to search Open Food Facts',
    placeholder_food_name: 'e.g. Greek yoghurt',
    meal_label: 'Meal', amount_label: 'Amount (g)',
    values_per_100g: 'Values per 100 g',
    calories_label: 'Calories', protein_g_label: 'Protein (g)', carbs_g_label: 'Carbs (g)', fat_g_label: 'Fat (g)',
    cancel: 'Cancel', save: 'Save',
    alert_need_name: 'Give the food a name.',
    alert_need_amount: 'Enter an amount in grams.',
    alert_need_kcal: 'Enter the calories per 100 g.',
    search_searching: 'Searching Open Food Facts…',
    search_no_matches: 'No online matches — fill the values in yourself.',
    search_unreachable: 'Could not reach Open Food Facts. Enter values manually.',

    weight_title: 'Weight tracker',
    new_measurement: 'New measurement',
    date_label: 'Date', weight_kg_label: 'Weight (kg)', bodyfat_pct_label: 'Body fat (%)',
    bmi_label: 'BMI (calculated)', bmr_label: 'BMR kcal/d (calculated)',
    clear: 'Clear',
    height_age_hint: 'Height and age come from Settings.',
    progress_title: 'Progress',
    range_4weeks: 'Last 4 weeks', range_3months: 'Last 3 months',
    range_6months: 'Last 6 months', range_alltime: 'All time',
    legend_weight: 'Weight (kg)', legend_bodyfat: 'Body fat (%)',
    chart_aria: 'Weight and body fat over time',
    chart_empty_hint: 'Log at least two measurements to see the trend.',
    recent_measurements: 'Recent measurements', no_measurements_yet: 'No measurements yet.',
    confirm_delete_measurement: 'Delete this measurement?',
    alert_pick_date: 'Pick a date.',
    alert_need_weight: 'Enter your weight in kg.',

    settings_title: 'Settings',
    about_you: 'About you',
    gender_label: 'Gender', female: 'Female', male: 'Male',
    birth_year_label: 'Birth year', height_cm_label: 'Height (cm)',
    derived_text: 'Using {{kg}} kg (latest measurement) · age {{age}} · BMI {{bmi}} · BMR {{bmr}} kcal/day',
    calories_card_title: 'Calories',
    calories_hint: 'Expenditure is what you burn. Intake target is what you aim to eat.',
    exp_workout: 'Expenditure — workout', exp_rest: 'Expenditure — rest',
    intake_workout: 'Intake target — workout', intake_rest: 'Intake target — rest',
    macros_card_title: 'Macros (grams per kg bodyweight)',
    protein_workout: 'Protein — workout', protein_rest: 'Protein — rest',
    carbs_workout: 'Carbs — workout', carbs_rest: 'Carbs — rest',
    fat_workout: 'Fat — workout', fat_rest: 'Fat — rest',
    carbs_fill_gap: 'Carbs fill the gap',
    carbs_fill_gap_hint: 'Ignore the carb multiplier; use leftover calories instead',
    save_settings: 'Save settings',
    settings_mismatch_notice: 'On a workout day your macros come to <strong>{{implied}} kcal</strong> against an intake target of <strong>{{target}}</strong> ({{gap}}). That’s allowed — the rings will just disagree.',
    backup_card_title: 'Backup',
    backup_hint: 'Your data lives only in this browser. Clearing browser data erases it — export regularly.',
    export_backup: 'Export backup', import_backup: 'Import backup',
    confirm_import: 'Importing replaces everything currently stored. Continue?',
    alert_settings_saved: 'Settings saved. Past days keep the targets they were logged with.',
    alert_backup_restored: 'Backup restored.',
    alert_backup_read_error: 'That file could not be read: {{msg}}'
  },

  zh: {
    nav_summary: '概览', nav_food: '饮食', nav_weight: '体重', nav_settings: '设置',

    summary_title: '概览',
    prev_day: '前一天', next_day: '后一天', close: '关闭', add_food_fab: '添加食物',
    today: '今天', yesterday: '昨天',
    workout_day: '训练日', workout_hint: '切换为训练日目标',
    burned: '消耗', eaten: '摄入', deficit: '缺口',
    ring_calories: '热量', ring_protein: '蛋白质', ring_carbs: '碳水', ring_fat: '脂肪',
    ring_over: '超出 {{n}} {{unit}}', ring_left: '剩余 {{n}} {{unit}}', ring_of: '共 {{n}} {{unit}}',
    notice_macro_mismatch: '你的宏量营养素目标合计 <strong>{{implied}} 千卡</strong>，但摄入目标是 <strong>{{target}}</strong>（{{gap}}）。可以在设置中调整，或开启"碳水自动补差"。',

    food_title: '饮食记录',
    meal_breakfast: '早餐', meal_lunch: '午餐', meal_dinner: '晚餐', meal_snacks: '加餐',
    add_another: '+ 继续添加', nothing_logged: '还没有记录 — 点击添加',
    fav_label: '收藏', delete_label: '删除',
    confirm_delete_entry: '删除这条记录？',

    modal_add_food: '添加食物', modal_edit_food: '编辑食物',
    name_search_label: '名称 — 输入以搜索 Open Food Facts',
    placeholder_food_name: '例如：希腊酸奶',
    meal_label: '餐次', amount_label: '重量（克）',
    values_per_100g: '每 100 克的数值',
    calories_label: '热量', protein_g_label: '蛋白质（克）', carbs_g_label: '碳水（克）', fat_g_label: '脂肪（克）',
    cancel: '取消', save: '保存',
    alert_need_name: '请填写食物名称。',
    alert_need_amount: '请输入重量（克）。',
    alert_need_kcal: '请输入每 100 克的热量。',
    search_searching: '正在搜索 Open Food Facts…',
    search_no_matches: '没有找到在线匹配 — 请手动填写数值。',
    search_unreachable: '无法连接 Open Food Facts，请手动填写数值。',

    weight_title: '体重记录',
    new_measurement: '新增记录',
    date_label: '日期', weight_kg_label: '体重（千克）', bodyfat_pct_label: '体脂率（%）',
    bmi_label: 'BMI（自动计算）', bmr_label: 'BMR 千卡/天（自动计算）',
    clear: '清空',
    height_age_hint: '身高和年龄来自设置。',
    progress_title: '趋势',
    range_4weeks: '最近 4 周', range_3months: '最近 3 个月',
    range_6months: '最近 6 个月', range_alltime: '全部时间',
    legend_weight: '体重（千克）', legend_bodyfat: '体脂率（%）',
    chart_aria: '体重与体脂率随时间变化',
    chart_empty_hint: '至少记录两次才能看到趋势。',
    recent_measurements: '最近记录', no_measurements_yet: '还没有任何记录。',
    confirm_delete_measurement: '删除这条记录？',
    alert_pick_date: '请选择日期。',
    alert_need_weight: '请输入体重（千克）。',

    settings_title: '设置',
    about_you: '个人信息',
    gender_label: '性别', female: '女', male: '男',
    birth_year_label: '出生年份', height_cm_label: '身高（厘米）',
    derived_text: '基于 {{kg}} 千克（最近记录）· {{age}} 岁 · BMI {{bmi}} · BMR {{bmr}} 千卡/天',
    calories_card_title: '热量',
    calories_hint: '消耗是你燃烧的热量，摄入目标是你计划吃的热量。',
    exp_workout: '消耗 — 训练日', exp_rest: '消耗 — 休息日',
    intake_workout: '摄入目标 — 训练日', intake_rest: '摄入目标 — 休息日',
    macros_card_title: '宏量营养素（每公斤体重的克数）',
    protein_workout: '蛋白质 — 训练日', protein_rest: '蛋白质 — 休息日',
    carbs_workout: '碳水 — 训练日', carbs_rest: '碳水 — 休息日',
    fat_workout: '脂肪 — 训练日', fat_rest: '脂肪 — 休息日',
    carbs_fill_gap: '碳水自动补差',
    carbs_fill_gap_hint: '忽略碳水倍率，用剩余热量代替',
    save_settings: '保存设置',
    settings_mismatch_notice: '训练日你的宏量营养素合计 <strong>{{implied}} 千卡</strong>，而摄入目标是 <strong>{{target}}</strong>（{{gap}}）。这是允许的 — 环形图只是会不一致。',
    backup_card_title: '备份',
    backup_hint: '数据只保存在本浏览器中。清除浏览器数据会导致丢失 — 请定期导出备份。',
    export_backup: '导出备份', import_backup: '导入备份',
    confirm_import: '导入会覆盖当前保存的所有数据，确定继续吗？',
    alert_settings_saved: '设置已保存。之前的日期仍保留记录时的目标。',
    alert_backup_restored: '备份已恢复。',
    alert_backup_read_error: '无法读取该文件：{{msg}}'
  }
};

export function getLang() {
  const saved = localStorage.getItem(KEY);
  return saved === 'zh' ? 'zh' : 'en';
}

export function setLang(lang) {
  localStorage.setItem(KEY, lang === 'zh' ? 'zh' : 'en');
}

export function t(key, vars) {
  let s = STRINGS[getLang()][key] ?? STRINGS.en[key] ?? key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replaceAll(`{{${k}}}`, v); });
  return s;
}

export function localeTag() {
  return getLang() === 'zh' ? 'zh-CN' : 'en-US';
}

/* Applies translations to every static element marked up with
   data-i18n / data-i18n-placeholder / data-i18n-aria in index.html. */
export function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('is-active', b.dataset.lang === getLang());
  });
  document.documentElement.lang = getLang() === 'zh' ? 'zh-CN' : 'en';
}
