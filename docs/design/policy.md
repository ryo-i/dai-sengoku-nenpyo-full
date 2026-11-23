# 設計方針

## 1. 設計判断の前提・根拠

* **根拠資料：** 本スレッドにおける設計議論および参照資料（Wikipedia「姫路城」、GitHubリポジトリ `dai-sengoku-nenpyo`、および日本暦法史・改元制度・歴史地理・GIS・RDB/Webアプリ構成・歴史シミュレーションゲームUIに関する一般的知見）


* **対象時代と元号のズレ：** 年表の主対象は享徳の乱（1454年頃）〜大坂の陣（1615年頃）を想定しつつ、元号の存続期間はその前後へはみ出す（「享徳」は1452年開始、「元和」は1615年7月改元〜1624年終了など）。
* **年内改元と暦の扱い：**
* 年の途中で改元される年（例：1573年の元亀4年→天正元年）は、改元日前後で元号が分かれる一方、年単位の併記や年内遡及表記の慣習も存在する。
* 日本国内は「和暦優先＋西暦年併記（例：`応仁元年（1467年）5月26日`）」、東アジアは「西暦年＋史料の旧暦月日」、西洋等は「西暦年月日」を基本とする。
* 旧暦の大小の月（29/30日）・閏月・月末や西暦換算は、1ヶ月単位の暦マスタ（`calendar_master`）と改元日・存続期間を持つ元号マスタ（`wareki_eras`）で扱う。


* **場所の扱い：**
* 令制国を重視しつつ、現代の都道府県・市区町村を参考・目安として併記（例：`播磨国（兵庫県姫路市）`）し、不明な郡名や市区町村は `NULL` を許容する。


* 裏方の地図描画・距離計算・方面自動判定用としてグリッド座標（`row_y, col_x`）や緯度経度を活用し、複数国にまたがる場所は多対多（`place_provinces`）で紐づける。


* **人物・権力者・勢力・主従の多層性：**
* 天皇・関白・将軍・公方・管領なども `persons` に登録し、在任履歴（`epoch_authorities`）で再任や東西幕府・南北朝などの並立を管理する。
* 守護大名と戦国大名は実態が連続的（ボーダレス）であり、下剋上による守護の傀儡化や、小早川・吉川のような陪臣の直臣大名化（掛け持ち・二重主従）、時期による主君変更も存在するため、単層・排他的な主従関係ではなく履歴・属性で多層的に管理する。


* **現行プロトタイプと移行先：** スプレッドシートから生成したJSONをNext.jsのAPIで読み込み、ラベル絞り込みやフリーワード検索を行う現行構成（`dai-sengoku-nenpyo`）から、NestJS＋PostgreSQLのバックエンド環境へ段階的に移行する方針。



---

## 2. 実装アイデア：アップデート版3軸DBスキーマ（PostgreSQLベース・全18テーブル案）

これまでの18テーブル案に、地図表現で固まった「親勢力（階層表示）・略称バッジ・家紋/パターン識別」のカラムを `factions` へ反映した構成案です。

### ① 時期軸（元号マスタ＋暦マスタ＋共通時期カラム）

```sql
-- 0. 元号マスタ（改元日・存続期間・入力チェック・併記/抽出補助用）
CREATE TABLE wareki_eras (
    wareki_era VARCHAR(20) PRIMARY KEY,            -- 例: '享徳', '応仁', '元亀', '天正', '元和'
    era_reading VARCHAR(40),                       -- 読みがな
    era_order INT NOT NULL,                        -- 時代順ソート・選択肢表示順
    start_wareki_year INT NOT NULL DEFAULT 1,      -- 開始和暦年（通常1＝元年）
    start_month INT NOT NULL,                      -- 改元月（旧暦）
    start_day INT NOT NULL,                        -- 改元日（旧暦）
    start_western_date DATE NOT NULL,              -- 改元日（西暦換算）
    end_wareki_year INT,                           -- 最終和暦年
    end_month INT,                                 -- 終了月（旧暦）
    end_day INT,                                   -- 終了日（旧暦）
    end_western_date DATE,                         -- 終了日（西暦換算）
    note TEXT                                      -- 改元事情・年内遡及などの補足
);

-- 1. 暦マスタ（旧暦大小・閏月・月末逆引き・西暦換算用：1ヶ月＝1行）
CREATE TABLE calendar_master (
    calendar_system VARCHAR(20) NOT NULL,          -- 'LUNAR_JP'(日本旧暦), 'LUNAR_EA'(東アジア旧暦), 'SOLAR'(ユリウス/グレゴリオ暦)
    wareki_era VARCHAR(20) REFERENCES wareki_eras(wareki_era),
    wareki_year INT,                               -- 和暦年
    western_year INT NOT NULL,                     -- 西暦年（例: 1467, 1573, 1582）
    month INT NOT NULL,                            -- 1〜12
    is_leap_month BOOLEAN NOT NULL DEFAULT FALSE,  -- 閏月フラグ
    last_day INT NOT NULL,                         -- 末日（旧暦29/30、新暦28/29/30/31）
    gregorian_start DATE NOT NULL,                 -- 期間開始日（西暦換算）
    gregorian_end DATE NOT NULL,                   -- 期間終了日（西暦換算）
    era_split_note VARCHAR(100),                   -- 年途中改元の補足
    PRIMARY KEY (calendar_system, western_year, month, is_leap_month, COALESCE(wareki_era, ''))
);

```

**▼ 履歴・イベントテーブルに共通で持たせる「時期カラムセット」仕様**

* **表示・入力用：** `calendar_origin`（`WAREKI_MAIN` / `WESTERN_LUNAR` / `WESTERN_SOLAR`）、`wareki_era`、`wareki_year`、`western_year`、`month`、`is_leap_month`、`day`、`period_tags TEXT[]`（例：`ARRAY['年間']`、`ARRAY['初期']`〜`ARRAY['末期']`、`ARRAY['上旬']` 等）、`date_display VARCHAR(120)`（例：`応仁元年（1467年）5月26日`、`元亀4年／天正元年（1573年）`、`天正年間`）
* **検索・ソート用：** `sort_start TIMESTAMP`、`sort_end TIMESTAMP`（表示はありのままの粒度を保ちつつ、検索・地図スライダー判定用の開始〜終了期間を自動補完して保持）

---

### ② 場所軸（地方・国・グリッド・地点・複数国紐づけ）

```sql
-- 2. 地方マスタ
CREATE TABLE regions (
    region_code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 3. 旧国マスタ（陸奥・出羽の分割や特例基準を反映）
CREATE TABLE provinces (
    province_code VARCHAR(20) PRIMARY KEY,
    region_code VARCHAR(20) NOT NULL REFERENCES regions(region_code),
    name VARCHAR(50) NOT NULL,
    default_prefecture VARCHAR(30),
    boundary_note TEXT
);

-- 4. グリッド（マス目）マスタ（行数列数を裏方基準座標・地図描画基準として保持）
CREATE TABLE grid_cells (
    row_y INT NOT NULL,
    col_x INT NOT NULL,
    is_land BOOLEAN NOT NULL DEFAULT TRUE,
    primary_province_code VARCHAR(20) REFERENCES provinces(province_code),
    auto_direction VARCHAR(20),
    note TEXT,
    PRIMARY KEY (row_y, col_x)
);

-- 5. 地点・地名マスタ（城・郡・山・川・合戦場・寺内町・現代市区町村目安など）
CREATE TABLE places (
    place_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    place_kind VARCHAR(20) NOT NULL,               -- 'CASTLE', 'GUN', 'BATTLEFIELD', 'NATURE', 'CITY', 'TEMPLE_TOWN', 'COURT_CAPITAL', 'AREA'
    is_major_base BOOLEAN NOT NULL DEFAULT FALSE,
    gun_name VARCHAR(60),                          -- 当時の郡名（不明・未確定ならNULL可）
    gun_era_context VARCHAR(30),
    modern_prefecture VARCHAR(30),
    modern_municipality VARCHAR(80),               -- 現代市区町村（目安・不明ならNULL可）
    directions TEXT[],                             -- 方面タグ配列（検索・補助用）
    row_y INT,
    col_x INT,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    note TEXT,
    FOREIGN KEY (row_y, col_x) REFERENCES grid_cells(row_y, col_x)
);

-- 6. 地点と国の紐づけ（複数国またぎ対応）
CREATE TABLE place_provinces (
    place_id INT NOT NULL REFERENCES places(place_id),
    province_code VARCHAR(20) NOT NULL REFERENCES provinces(province_code),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (place_id, province_code)
);

```

---

### ③ 人物・権力者・勢力軸

```sql
-- 7. 人物マスタ
CREATE TABLE persons (
    person_id SERIAL PRIMARY KEY,
    canonical_name VARCHAR(100) NOT NULL,
    birth_year INT,
    death_year INT,
    note TEXT
);

-- 8. 名前履歴（幼名・諱・通称・法号）
CREATE TABLE person_names (
    name_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES persons(person_id),
    name_type VARCHAR(20) NOT NULL,
    name_text VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    wareki_era_from VARCHAR(20), wareki_year_from INT, western_year_from INT, month_from INT, day_from INT,
    wareki_era_to VARCHAR(20),   wareki_year_to INT,   western_year_to INT,   month_to INT,   day_to INT,
    sort_start TIMESTAMP,
    sort_end TIMESTAMP
);

-- 9. 権力者・在任履歴（天皇・関白・将軍・公方・管領：再任・並立対応）
CREATE TABLE epoch_authorities (
    authority_id SERIAL PRIMARY KEY,
    office_type VARCHAR(20) NOT NULL,              -- 'EMPEROR', 'KAMPAKU', 'SHOGUN', 'KUBO', 'KANREI'
    person_id INT NOT NULL REFERENCES persons(person_id),
    faction_label VARCHAR(50),
    legitimacy_type VARCHAR(20) NOT NULL,
    term_order INT NOT NULL DEFAULT 1,
    wareki_era_from VARCHAR(20), wareki_year_from INT, western_year_from INT, month_from INT, day_from INT,
    wareki_era_to VARCHAR(20),   wareki_year_to INT,   western_year_to INT,   month_to INT,   day_to INT,
    sort_start TIMESTAMP,
    sort_end TIMESTAMP,
    note TEXT
);

-- 10. 地位・官位・役職履歴（大分類コード＋具体名ハイブリッド）
CREATE TABLE person_titles (
    title_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES persons(person_id),
    title_system VARCHAR(20) NOT NULL,
    role_category VARCHAR(20) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    wareki_era_from VARCHAR(20), wareki_year_from INT, western_year_from INT, month_from INT, day_from INT,
    wareki_era_to VARCHAR(20),   wareki_year_to INT,   western_year_to INT,   month_to INT,   day_to INT,
    sort_start TIMESTAMP,
    sort_end TIMESTAMP
);

-- 11. 勢力・大名家・国人マスタ（多層階層・地図識別バッジ/パターン対応）
CREATE TABLE factions (
    faction_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                    -- 例: '織田氏', '武田氏', '小早川氏', '加賀一向一揆'
    short_name VARCHAR(20) NOT NULL,               -- 地図ラベル用略称（例: '織田', '武田', '小早川', '一向一揆'）
    badge_char VARCHAR(4),                         -- 家紋不明時の1〜2文字バッジ（例: '織', '小', '一揆'）
    mon_svg_key VARCHAR(50),                       -- 家紋SVGキー（不明・未登録ならNULL可）
    parent_faction_id INT REFERENCES factions(faction_id), -- 宗家・上位政権ID（俯瞰モードのグループ化用）
    display_tier INT NOT NULL DEFAULT 2,           -- 表示階層（1:天下人/大大名, 2:有力大名/譜代, 3:国人/小勢力）
    polity_type VARCHAR(20) NOT NULL,              -- 'SHUGO_DAIMYO', 'SENGOKU_DAIMYO', 'SMALL_DAIMYO', 'KOKUJIN', 'RELIGIOUS', 'FOREIGN'
    is_puppet BOOLEAN NOT NULL DEFAULT FALSE,      -- 名目のみ・傀儡フラグ
    color_code VARCHAR(7),                         -- 主要勢力の固定テーマカラー（例: '#C83C32'）
    pattern_type VARCHAR(20) DEFAULT 'SOLID',      -- 'SOLID', 'STRIPE', 'DOT', 'CROSS'（隣接色被り・従属識別用）
    note TEXT
);

-- 12. 人物の所属勢力・主従履歴（同時並立・掛け持ち・主君変更に対応）
CREATE TABLE person_affiliations (
    affiliation_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES persons(person_id),
    faction_id INT NOT NULL REFERENCES factions(faction_id),
    lord_person_id INT REFERENCES persons(person_id),
    relation_type VARCHAR(20) NOT NULL,            -- 'HEAD', 'VASSAL', 'CLAN_VASSAL', 'DIRECT_DAIMYO', 'SEMI_INDEPENDENT', 'YORIKI'
    is_primary_faction BOOLEAN NOT NULL DEFAULT TRUE,
    is_de_facto_ruler BOOLEAN NOT NULL DEFAULT FALSE,
    wareki_era_from VARCHAR(20), wareki_year_from INT, western_year_from INT, month_from INT, day_from INT,
    wareki_era_to VARCHAR(20),   wareki_year_to INT,   western_year_to INT,   month_to INT,   day_to INT,
    sort_start TIMESTAMP,
    sort_end TIMESTAMP
);

```

---

### ④ 3軸が交差するトランザクション群

```sql
-- 13. 所領・拠点履歴
CREATE TABLE person_domains (
    domain_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES persons(person_id),
    province_code VARCHAR(20) REFERENCES provinces(province_code),
    place_id INT REFERENCES places(place_id),
    domain_type VARCHAR(20) NOT NULL,
    wareki_era_from VARCHAR(20), wareki_year_from INT, western_year_from INT, month_from INT, day_from INT,
    wareki_era_to VARCHAR(20),   wareki_year_to INT,   western_year_to INT,   month_to INT,   day_to INT,
    sort_start TIMESTAMP,
    sort_end TIMESTAMP
);

-- 14. 物理的滞在・行動履歴
CREATE TABLE person_locations (
    stay_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES persons(person_id),
    province_code VARCHAR(20) REFERENCES provinces(province_code),
    place_id INT REFERENCES places(place_id),
    place_detail VARCHAR(100),
    stay_status VARCHAR(20) NOT NULL,
    wareki_era_from VARCHAR(20), wareki_year_from INT, western_year_from INT, month_from INT, day_from INT,
    wareki_era_to VARCHAR(20),   wareki_year_to INT,   western_year_to INT,   month_to INT,   day_to INT,
    sort_start TIMESTAMP,
    sort_end TIMESTAMP
);

-- 15. 勢力支配履歴（年ベース決め打ち＋激動年の年内局面スナップショット対応）
CREATE TABLE area_controls (
    control_id SERIAL PRIMARY KEY,
    province_code VARCHAR(20) REFERENCES provinces(province_code),
    place_id INT REFERENCES places(place_id),
    row_y INT,
    col_x INT,
    faction_id INT NOT NULL REFERENCES factions(faction_id),
    phase_label VARCHAR(60),                       -- 激動年の局面ラベル（例: '武田滅亡後', '本能寺〜山崎'、通常年はNULL）
    wareki_era_from VARCHAR(20), wareki_year_from INT, western_year_from INT, month_from INT, day_from INT,
    wareki_era_to VARCHAR(20),   wareki_year_to INT,   western_year_to INT,   month_to INT,   day_to INT,
    sort_start TIMESTAMP,
    sort_end TIMESTAMP,
    FOREIGN KEY (row_y, col_x) REFERENCES grid_cells(row_y, col_x)
);

-- 16. 年表イベント（出来事本体）
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    event_category VARCHAR(30),
    summary TEXT,
    region_code VARCHAR(20) REFERENCES regions(region_code),
    province_code VARCHAR(20) REFERENCES provinces(province_code),
    place_id INT REFERENCES places(place_id),
    place_detail VARCHAR(120),
    calendar_origin VARCHAR(20) NOT NULL DEFAULT 'WAREKI_MAIN',
    wareki_era VARCHAR(20) REFERENCES wareki_eras(wareki_era),
    wareki_year INT,
    western_year INT,
    month INT,
    is_leap_month BOOLEAN NOT NULL DEFAULT FALSE,
    day INT,
    period_tags TEXT[],
    date_display VARCHAR(120),
    sort_start TIMESTAMP,
    sort_end TIMESTAMP,
    source_note TEXT
);

-- 17. 年表イベントの関与人物
CREATE TABLE event_participants (
    event_id INT NOT NULL REFERENCES events(event_id),
    person_id INT NOT NULL REFERENCES persons(person_id),
    role VARCHAR(50),
    PRIMARY KEY (event_id, person_id)
);

```

---

## 3. 実装アイデア：検索・日本地図・時系列スライダー・移行方針

### ① 日本地図の表現レイヤー設計（面・点・枠外の3層分担）

1. **【面（マス目グリッド／旧国・エリアポリゴン）】実効支配レイヤー：**
* `grid_cells`（`row_y, col_x`）を座標・計算・領域判定の裏方基準としつつ、描画はマス目グリッドまたは旧国・エリア単位のポリゴン（GeoJSON/TopoJSON）で実質支配者（実効支配勢力）を塗り分ける。
* 守護大名から戦国大名への移行は同じ `faction_id` で連続表現し、傀儡・名目主君の事情は詳細パネルやラベルで併記する。


2. **【点（拠点アイコン・バッジ）】拠点・ネットワークレイヤー：**
* 城や合戦場だけでなく、**朝廷（御所）・将軍所在（室町殿・鞆幕府）・石山本願寺などの寺内町・有力家臣や譜代の居城**のように「面積は狭いが歴史的重要度が高い拠点」をピンで配置する。これにより、豊臣・徳川の版図内における大名配置（内訳）や本願寺のネットワークも一目で追える。


3. **【枠外ヘッダー（タイムライン連動ステータスバー）】権威・体制レイヤー：**
* 領域（面）では表現しにくい**天皇・関白・将軍・公方・管領**の在任状況（東西幕府や南北朝等の並立含む）を、地図上部のステータスバーに連動表示する。



### ② 勢力の色分けと階層表示ルール

* **主要勢力固定色 ＋ 外周境界線 ＋ パターン ＋ ホバー発光：**
* 有力大名（20〜30家程度）には固定のテーマカラー（`color_code`）を持たせ、群小勢力・国人は抑えた中間色パレットとする。
* 隣接勢力との色被り対策として、**同じ `faction_id` の塊の外周に太い境界線**を引き、必要に応じて斜線・ドット等のパターン（`pattern_type`）や、ホバー／選択時の**同一勢力一斉ハイライト**を組み合わせる。


* **家紋と漢字バッジのフォールバック：**
* 家紋が明確な大名は家紋SVG（`mon_svg_key`）を表示し、不明・未確定の勢力は丸・四角の紋章風バッジに1〜2文字の略称（`badge_char`）を表示する。


* **表示モード切り替え（俯瞰 vs 内訳）：**
* 織豊期（本能寺後の織田系グループ・小早川や吉川の二重帰属など）や徳川期では、「大枠（宗家・上位政権でグループ化）」**と**「内訳（譜代・有力大名・独立勢力ごとに細分化）」を切り替えられるトグルを設ける。



### ③ 時系列スライダーと「激動年（1582年等）」の動的連動

* **基本は「年刻み（1454年〜1615年）」＋ 激動年のみ「年内局面（サブステップ）」：**
* 普段は1年刻み（約162ステップ）で軽快に操作でき、重要イベント密度が高い年にはスライダー下にマーカーを表示する。
* 1582年（武田滅亡 → 本能寺の変 → 山崎の戦い → 清洲会議）や1600年など、1年の中で勢力図が激変する年だけは、年内の局面（`phase_label` やイベント選択連動）へ掘り下げられるサブセレクタを用意する。


* **自動補完と半自動逆引き：**
* `area_controls` は年単位の決め打ちをベースラインとして持ちつつ、詳細度がバラバラなデータも `sort_start` / `sort_end` の自動補完ルールで統一的に期間判定（`sort_start <= query_end AND sort_end >= query_start`）する。
* ドラッグ中のAPI負荷はデバウンスやキャッシュで抑え、色の変化には短いトランジションを効かせる。



### ④ 検索・絞り込み＆NestJS＋PostgreSQLへの段階移行

* **検索ルール：** 人物（改名履歴含む）・時期（元号/西暦/期間）・場所（国/複数国またぎ/地点）・キーワードの複合AND検索に対応。元号や令制国など階層が明確な上位枠は下位を含めて拾い、「前期〜末期」「東部・西部」などの相対ラベルは一致・補助タグ扱いで判断の迷いを防ぐ。
* **段階移行：** 既存のNext.js＋JSONプロトタイプ（`dai-sengoku-nenpyo`）から、まずは最小コア（`events`・`wareki_eras`・`provinces`/`places`・`persons`/`event_participants`）＋JSON取り込みスクリプトでNestJS＋PostgreSQLへ移行し、その後に暦マスタ・履歴テーブル・地図＋スライダー連携を順次拡張していく。



---

## 4. 検討したが見送り・却下とした案（設計上の判断メモ）

### ① 身分・勢力区分の「単一ラベル（1カラム排他分類）」案

* **見送った理由：** 守護から戦国大名への転化、傀儡・下剋上による名目と実態の乖離、陪臣の二重主従などを1つの排他ラベルでは無理なく表現できないため。
* **採用した代替案：** 公的地位（`person_titles`）、勢力階層・傀儡属性（`factions`）、複数並立可能な主従履歴（`person_affiliations`）に分離する方式。

### ② 家臣の地位・役職の「完全マスタ化」または「完全フリーテキスト化」案

* **見送った理由：** 家ごとの呼称差や例外が多く、完全マスタ化は肥大化しやすく、完全フリーテキストだけでは役割別の集計やまとめ検索がしにくくなるため。
* **採用した代替案：** 検索・集計用の大分類コード（`role_category`）と、史料上の具体名（`role_name`：フリーテキスト）を組み合わせるハイブリッド方式。

### ③ 戦国期の郡名を「幕末・明治初頭ベースへ一括読み替え」する案

* **見送った理由：** 時代による郡の分合・境界変更があり、戦国期の記述や文脈を一律に幕末・明治初頭基準へ書き換えると歴史的肌触りにズレが生じるため。
* **採用した代替案：** 当時の郡名や史料表現を尊重しつつ、不明時の `NULL` 許容や特例メモで柔軟に扱う方式。

### ④ 地図の境界線描画における「ベジェ曲線（SVG Path等）」案

* **見送った理由：** 隣接領域との境界調整や重なり・ズレの制御が複雑になり、地図データ連携や実装・保守コストが高くなるため。
* **採用した代替案：** グリッド（マス目）や直線頂点のポリゴン（GeoJSON / TopoJSON）、拠点の点などを組み合わせる方式。

### ⑤ 農業集落境界データ（全国約15万ピース）を「そのままアプリ・DBに抱える」案

* **見送った理由：** 全国未加工の大量ポリゴンをそのまま扱うと、前処理や描画・操作性の面で重くなりやすいため。
* **採用した代替案：** 必要な単位への結合・軽量化を行うか、マス目や旧国ポリゴン・現代市町村ベース・拠点の点など開発コストと表現力のバランスが取れる単位から始める方式。

### ⑥ 年表表記での「旧暦・ユリウス暦の全併記」および「海外の個別暦の並記」案

* **見送った理由：** すべての出来事に旧暦・ユリウス暦や各国元号を細かく並べると表記が冗長になり、入力・維持コストが膨らむため。
* **採用した代替案：** 日本国内は「和暦優先＋西暦年併記（例：`応仁元年（1467年）5月26日`）」、東アジアは「西暦年＋史料の旧暦月日」、西洋等は「西暦年月日」を基本とするルール。

### ⑦ 場所の一覧表記における「郡名のみ」や「国＋都道府県のみ」の単一採用案

* **見送った理由：** 郡名のみでは現代の地理感覚で想起しにくく、国＋都道府県のみでは広すぎて具体的な位置を掴みにくいため。


* **採用した代替案：** 一覧・年表の基本は「令制国（現代の都道府県＋市区町村）」（例：`播磨国（兵庫県姫路市）`）とし、郡名や詳細は詳細画面・別カラム・検索側で補完する方式。



### ⑧ グリッドの「行数列数」をそのまま人間向けテキストとして見せる案

* **見送った理由：** `Row 42, Col 18` のような数字だけでは、テキストを読んだときに場所が直感的にイメージしにくいため。
* **採用した代替案：** 行数列数は地図描画・距離計算・方面自動算出などの裏方基準座標とし、人間向けには令制国・現代市区町村・方面などで表現する方式。

### ⑨ 「160年全期間の日単位スライダー化」および「全イベントからの100%自動勢力図生成」案

* **見送った理由：** 全期間を日単位にするとステップ数とデータ整備コストが膨大になり、また日付が曖昧な史料も多いためイベントだけから完全自動で勢力図を逆算すると破綻しやすいため。
* **採用した代替案：** スライダーは年刻みを基本としつつ1582年などの激動年だけ年内局面を用意し、勢力図は年ベースの決め打ち＋イベントからの半自動候補提案で構築する方式。

### ⑩ 「完全四色塗り分け（動的色変更）」および「全勢力の家紋必須化」案

* **見送った理由：** スライダー移動時に隣接回避のため色を毎回変えると勢力の追跡性が落ち、逆に全勢力の家紋を必須にすると家紋不明の国人・小勢力でデータ登録が止まるため。
* **採用した代替案：** 主要勢力は固定色としつつ「勢力外周の太い境界線・パターン・ホバー発光」で隣接被りを識別し、家紋は「ある勢力は家紋SVG、不明勢力は漢字1〜2文字バッジ」へフォールバックする方式。