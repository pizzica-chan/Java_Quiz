import type { QuizQuestion } from "./quizTypes";

/** 各難易度を30問にするための追加問題（id 31–90） */
export const moreQuestions: QuizQuestion[] = [
  // ========== 初心者 追加 (20) ==========
  {
    id: 31,
    difficulty: "beginner",
    title: "条件式の書き方",
    description:
      "準備完了かどうかを判定する処理です。意図しない代入が起きている行を1つ選んでください。",
    code: [
      "public void startIfReady(boolean ready) {",
      "    if (ready = true) {",
      "        run();",
      "    }",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "条件式での代入",
    explanation:
      "if (ready = true) は比較ではなく代入です。常に true になり、ready の値も書き換わります。比較には == や、単純に if (ready) を使いましょう。",
    hint: "この式は「比べて」いますか、それとも「入れています」か？",
  },
  {
    id: 32,
    difficulty: "beginner",
    title: "配列の比較",
    description:
      "2つの配列が同じ内容かを調べる処理です。意図どおりに動かないことがある行を1つ選んでください。",
    code: [
      "public boolean same(int[] a, int[] b) {",
      "    return a == b;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "配列の == 比較",
    explanation:
      "配列の == は参照の同一性だけを見ます。中身の比較には Arrays.equals(a, b) を使いましょう。",
    hint: "別インスタンスでも中身が同じことはありますか？",
  },
  {
    id: 33,
    difficulty: "beginner",
    title: "割り算",
    description:
      "平均値を計算する処理です。実行時例外を招きうる行を1つ選んでください。",
    code: [
      "public int average(int total, int count) {",
      "    return total / count;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "ゼロ除算の未考慮",
    explanation:
      "count が 0 のとき ArithmeticException になります。除算前に count を検証するか、呼び出し側の契約を明確にしましょう。",
    hint: "分母が 0 だったらどうなりますか？",
  },
  {
    id: 34,
    difficulty: "beginner",
    title: "例外の見せ方",
    description:
      "失敗時の扱いです。運用やデバッグの観点で好ましくない行を1つ選んでください。",
    code: [
      "public void load() {",
      "    try {",
      "        doLoad();",
      "    } catch (IOException e) {",
      "        e.printStackTrace();",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "printStackTrace への依存",
    explanation:
      "printStackTrace は標準エラーへ直接出し、ログレベルや出力先を制御できません。ロガー経由で記録するか、適切に再スローしましょう。",
    hint: "本番でスタックトレースの行き先は決まっていますか？",
  },
  {
    id: 35,
    difficulty: "beginner",
    title: "文字列リテラル",
    description:
      "ステータス判定です。可読性・保守性の観点で問題のある行を選んでください。",
    code: [
      "public boolean isDone(String status) {",
      "    return status.equals(\"DONE\");",
      "}",
      "",
      "public boolean isFailed(String status) {",
      "    return status.equals(\"FAILED\");",
      "}",
    ],
    antiPatternLines: [2, 6],
    patternName: "マジックストリング",
    explanation:
      "\"DONE\" や \"FAILED\" がコードに直書きされています。定数や enum にすると、綴りミスや変更漏れを防げます（status が null のときは NPE も起きます）。",
    hint: "同じ意味の文字列が散らばっていませんか？",
  },
  {
    id: 36,
    difficulty: "beginner",
    title: "到達しないコード",
    description:
      "結果を返すメソッドです。実行されないコードを含む行を1つ選んでください。",
    code: [
      "public int calc(int x) {",
      "    return x * 2;",
      "    System.out.println(\"done\");",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "到達不能コード",
    explanation:
      "return の後の文は決して実行されません。不要なら削除し、必要な処理なら return の前に移しましょう。",
    hint: "この行はいつ実行されますか？",
  },
  {
    id: 37,
    difficulty: "beginner",
    title: "文字の取り出し",
    description:
      "先頭文字を返す処理です。実行時例外を招きうる行を1つ選んでください。",
    code: [
      "public char firstChar(String text) {",
      "    return text.charAt(0);",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "空文字への無防備な charAt",
    explanation:
      "text が空文字だと StringIndexOutOfBoundsException になります。長さを確認してから取り出すか、isEmpty を先に見ましょう。",
    hint: "空の文字列でも 0 番目はありますか？",
  },
  {
    id: 38,
    difficulty: "beginner",
    title: "捕捉する例外の種類",
    description:
      "処理の失敗を捕まえるコードです。捕捉範囲として広すぎる行を1つ選んでください。",
    code: [
      "public void runTask() {",
      "    try {",
      "        task.execute();",
      "    } catch (Throwable t) {",
      "        logger.error(\"failed\", t);",
      "    }",
      "}",
    ],
    antiPatternLines: [4],
    patternName: "Throwable の捕捉",
    explanation:
      "Throwable は Error まで含むため、OutOfMemoryError など本来捕捉すべきでないものまで捕まえ得ます。必要な例外型に絞りましょう。",
    hint: "Error まで同じ扱いでよいですか？",
  },
  {
    id: 39,
    difficulty: "beginner",
    title: "プロセスの終了",
    description:
      "ライブラリ内のユーティリティです。呼び出し側に影響しすぎる行を1つ選んでください。",
    code: [
      "public void ensureReady(boolean ready) {",
      "    if (!ready) {",
      "        System.exit(1);",
      "    }",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "System.exit の安易な使用",
    explanation:
      "System.exit は JVM 全体を終了させます。ライブラリや共有コンポーネントでは例外を投げるなど、呼び出し側に判断を委ねる方が安全です。",
    hint: "このメソッドはアプリ全体を止めますか？",
  },
  {
    id: 40,
    difficulty: "beginner",
    title: "秘密情報の置き場所",
    description:
      "外部サービス接続の設定です。セキュリティ上問題のある行を1つ選んでください。",
    code: [
      "public class MailClient {",
      "    private static final String PASSWORD = \"s3cret!\";",
      "",
      "    public void connect() {",
      "        login(\"admin\", PASSWORD);",
      "    }",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "ソースコードへの秘密情報の埋め込み",
    explanation:
      "パスワードをソースに直書きすると、リポジトリ漏洩時に危険です。環境変数やシークレット管理を使いましょう。",
    hint: "この文字列はリポジトリに入りませんか？",
  },
  {
    id: 41,
    difficulty: "beginner",
    title: "型の変換",
    description:
      "文字列を数値にする処理です。実行時例外を招きうる行を1つ選んでください。",
    code: [
      "public int parse(String raw) {",
      "    return Integer.parseInt(raw);",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "入力検証なしの parseInt",
    explanation:
      "不正な文字列だと NumberFormatException になります。形式チェックや例外処理、Optional 的な戻り値設計を検討しましょう。",
    hint: "数字以外が入ってきたら？",
  },
  {
    id: 42,
    difficulty: "beginner",
    title: "ループの終了条件",
    description:
      "リストを走査する処理です。実行時例外を招きうる行を1つ選んでください。",
    code: [
      "public void printAll(List<String> items) {",
      "    for (int i = 0; i <= items.size(); i++) {",
      "        System.out.println(items.get(i));",
      "    }",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "off-by-one（境界条件の誤り）",
    explanation:
      "i <= size() だと最後に size() 番目へアクセスし IndexOutOfBoundsException になります。通常は i < size() です。",
    hint: "最後の有効な添字はいくつですか？",
  },
  {
    id: 43,
    difficulty: "beginner",
    title: "真偽値の返し方",
    description:
      "条件を返すメソッドです。冗長で読みにくい行を選んでください。",
    code: [
      "public boolean isPositive(int n) {",
      "    if (n > 0) {",
      "        return true;",
      "    } else {",
      "        return false;",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 3, 4, 5],
    patternName: "不要な if-else による boolean 返却",
    explanation:
      "return n > 0; と書けば十分です。true/false を分岐で返すと読みにくく、ミスの温床になります。",
    hint: "条件式そのものを返せませんか？",
  },
  {
    id: 44,
    difficulty: "beginner",
    title: "オブジェクトの生成",
    description:
      "メッセージを組み立てる処理です。不要なオブジェクト生成がある行を1つ選んでください。",
    code: [
      "public String message(String name) {",
      "    StringBuilder sb = new StringBuilder(new String(\"Hello, \"));",
      "    sb.append(name);",
      "    return sb.toString();",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "不要な new String",
    explanation:
      "new String(\"Hello, \") は余分なコピーを作ります。文字列リテラルをそのまま渡せば十分です。",
    hint: "リテラルをわざわざ包む必要はありますか？",
  },
  {
    id: 45,
    difficulty: "beginner",
    title: "クラス設計の基本",
    description:
      "座標を表すクラスです。不変であるべき値が書き換え可能な行を選んでください。",
    code: [
      "public class Point {",
      "    public int x;",
      "    public int y;",
      "",
      "    public Point(int x, int y) {",
      "        this.x = x;",
      "        this.y = y;",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 3],
    patternName: "可変な public フィールド",
    explanation:
      "座標が外から自由に変わると、不変条件を保てません。private final にしてコンストラクタでセットしましょう。",
    hint: "生成後も自由に書き換えられますか？",
  },
  {
    id: 46,
    difficulty: "beginner",
    title: "メソッドの引数",
    description:
      "ユーザー登録処理です。不正な入力を許してしまう行を1つ選んでください。",
    code: [
      "public void register(String email) {",
      "    this.email = email;",
      "    save();",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "引数の未検証",
    explanation:
      "null や空文字のまま保存すると、後続で NPE や不正データになります。受け取り時に検証しましょう。",
    hint: "email が null でもそのまま通りますか？",
  },
  {
    id: 47,
    difficulty: "beginner",
    title: "リストの初期化",
    description:
      "固定の選択肢を返す処理です。後から内容が変わってしまう行を1つ選んでください。",
    code: [
      "public List<String> options() {",
      "    return Arrays.asList(\"A\", \"B\", \"C\");",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "固定長リストの誤解（set 可能な asList）",
    explanation:
      "Arrays.asList は要素の set が可能で、呼び出し側が書き換えられます。不変が必要なら List.of や unmodifiableList を検討しましょう。",
    hint: "返したリストは本当に変更できませんか？",
  },
  {
    id: 48,
    difficulty: "beginner",
    title: "日付の文字列化",
    description:
      "今日の日付を文字列にする処理です。環境依存になりやすい行を1つ選んでください。",
    code: [
      "public String today() {",
      "    return new Date().toString();",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "Date#toString への依存",
    explanation:
      "Date#toString の形式はロケールや実装に依存し、パースにも向きません。DateTimeFormatter などで明示的に整形しましょう。",
    hint: "この文字列の形式は仕様として安定していますか？",
  },
  {
    id: 49,
    difficulty: "beginner",
    title: "カウンタの更新",
    description:
      "アクセス数を数える処理です。意図しない結果になりうる行を1つ選んでください。",
    code: [
      "public void hit() {",
      "    count = count++;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "count = count++ の誤用",
    explanation:
      "count++ は古い値を返し、その後インクリメントします。count = count++ だと結果的に増えません。count++ または count += 1 と書きましょう。",
    hint: "代入の右辺が返す値は、増える前ですか後ですか？",
  },
  {
    id: 50,
    difficulty: "beginner",
    title: "finally の使い方",
    description:
      "結果を返す処理です。例外の情報を打ち消してしまう行を1つ選んでください。",
    code: [
      "public int read() {",
      "    try {",
      "        return doRead();",
      "    } finally {",
      "        return 0;",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "finally での return",
    explanation:
      "finally で return すると、try で起きた例外や本来の戻り値が握りつぶされます。finally ではリソース解放などに留めましょう。",
    hint: "例外が起きても、最終的に何が返りますか？",
  },

  // ========== 中級者 追加 (20) ==========
  {
    id: 51,
    difficulty: "intermediate",
    title: "防御的コピー",
    description:
      "期間を表すクラスです。外部から内部状態を変えられてしまう行を選んでください。",
    code: [
      "public class Period {",
      "    private final Date start;",
      "",
      "    public Period(Date start) {",
      "        this.start = start;",
      "    }",
      "",
      "    public Date getStart() {",
      "        return start;",
      "    }",
      "}",
    ],
    antiPatternLines: [5, 9],
    patternName: "可変オブジェクトの取り込み・露出",
    explanation:
      "Date は可変です。受け取った参照や返した参照経由で中身を変えられます。コンストラクタと getter で防御的コピーをしましょう。",
    hint: "返した Date の setTime は誰でも呼べますか？",
  },
  {
    id: 52,
    difficulty: "intermediate",
    title: "ログメッセージの組み立て",
    description:
      "デバッグログを出す処理です。性能上好ましくない行を1つ選んでください。",
    code: [
      "public void debugUser(User user) {",
      "    logger.debug(\"user=\" + user.toDetailString());",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "ログレベル判定前のメッセージ構築",
    explanation:
      "debug が無効でも toDetailString と文字列連結が走ります。logger.isDebugEnabled() やパラメータ付きログ（\"user={}\", user）を使いましょう。",
    hint: "ログレベルが OFF でも、この計算は走りますか？",
  },
  {
    id: 53,
    difficulty: "intermediate",
    title: "ハッシュの一貫性",
    description:
      "値オブジェクトです。HashMap などで正しく動かなくなる実装行を1つ選んでください。",
    code: [
      "public class Sku {",
      "    private final String code;",
      "",
      "    @Override",
      "    public boolean equals(Object o) {",
      "        return o instanceof Sku s && code.equals(s.code);",
      "    }",
      "",
      "    @Override",
      "    public int hashCode() {",
      "        return 1;",
      "    }",
      "}",
    ],
    antiPatternLines: [11],
    patternName: "equals と矛盾する hashCode",
    explanation:
      "常に 1 を返す hashCode は等価なオブジェクトを同じバケツに押し込み、性能を壊します。またフィールドを使わない実装は保守時に equals とズレやすいです。Objects.hash(code) を使いましょう。",
    hint: "等しいオブジェクトのハッシュは同じである必要がありますが、中身を反映していますか？",
  },
  {
    id: 54,
    difficulty: "intermediate",
    title: "オートボクシング",
    description:
      "合計を求める処理です。実行時例外を招きうる行を1つ選んでください。",
    code: [
      "public int sum(List<Integer> values) {",
      "    int total = 0;",
      "    for (Integer v : values) {",
      "        total += v;",
      "    }",
      "    return total;",
      "}",
    ],
    antiPatternLines: [4],
    patternName: "null のアンボクシング",
    explanation:
      "List に null が含まれると、total += v で NullPointerException になります。null チェックや Objects.requireNonNullElse を検討しましょう。",
    hint: "v が null のとき加算はどうなりますか？",
  },
  {
    id: 55,
    difficulty: "intermediate",
    title: "ファイルの読み方",
    description:
      "テキストを読む処理です。文字化けや環境依存を招きうる行を1つ選んでください。",
    code: [
      "public String read(Path path) throws IOException {",
      "    return new String(Files.readAllBytes(path));",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "デフォルト文字セットへの依存",
    explanation:
      "引数なしの new String(byte[]) はプラットフォームのデフォルト文字セットを使います。StandardCharsets.UTF_8 などを明示しましょう。",
    hint: "別 OS でも同じ文字に読めますか？",
  },
  {
    id: 56,
    difficulty: "intermediate",
    title: "クローン",
    description:
      "配列を複製する処理です。意図と違う共有が起きる行を1つ選んでください。",
    code: [
      "public String[] copy(String[] source) {",
      "    return source;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "参照の返しによる偽のコピー",
    explanation:
      "参照をそのまま返すと呼び出し側と配列を共有します。Arrays.copyOf や clone で実体を複製しましょう。",
    hint: "返した配列を書き換えると、元はどうなりますか？",
  },
  {
    id: 57,
    difficulty: "intermediate",
    title: "Optional の使い方",
    description:
      "ユーザー取得です。Optional の意図に反する行を1つ選んでください。",
    code: [
      "public User getUser(long id) {",
      "    return repository.find(id).orElse(null);",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "Optional から null を取り出す",
    explanation:
      "Optional を使う意味が薄れ、再び NPE のリスクが戻ります。Optional を返すか、orElseThrow / デフォルトオブジェクトを使いましょう。",
    hint: "Optional を導入した理由は何でしたか？",
  },
  {
    id: 58,
    difficulty: "intermediate",
    title: "ストリームの終端",
    description:
      "フィルタ結果を使う処理です。途中でストリームを壊す行を1つ選んでください。",
    code: [
      "public void printLongNames(List<String> names) {",
      "    Stream<String> stream = names.stream().filter(n -> n.length() > 3);",
      "    stream.forEach(System.out::println);",
      "    stream.count();",
      "}",
    ],
    antiPatternLines: [4],
    patternName: "消費済み Stream の再利用",
    explanation:
      "Stream は終端操作のあと再利用できません。count() で IllegalStateException になります。必要なら元データから作り直しましょう。",
    hint: "forEach のあと、同じ stream はまだ使えますか？",
  },
  {
    id: 59,
    difficulty: "intermediate",
    title: "可変引数と配列",
    description:
      "ログ出力のヘルパーです。ヒープ汚染や型安全性を損なう行を選んでください。",
    code: [
      "public void logAll(List<String>... groups) {",
      "    Object[] rows = groups;",
      "    rows[0] = List.of(42);",
      "    String first = groups[0].get(0);",
      "}",
    ],
    antiPatternLines: [2, 3],
    patternName: "ジェネリック可変引数のヒープ汚染",
    explanation:
      "ジェネリック可変引数は配列として扱われ、ヒープ汚染の温床です。Object[] 経由の代入は特に危険です。List の List を渡す設計にしましょう。",
    hint: "可変引数の実体は何の配列ですか？",
  },
  {
    id: 60,
    difficulty: "intermediate",
    title: "定数の定義",
    description:
      "設定クラスです。変更できてしまう定数宣言を選んでください。",
    code: [
      "public class Limits {",
      "    public static final int[] MAX = { 10, 20, 30 };",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "final でも中身が可変な配列",
    explanation:
      "配列参照が final でも要素は書き換えられます。不変が必要なら List.of や防御的コピー、専用の不変オブジェクトを使いましょう。",
    hint: "MAX[0] = 99 はコンパイルできますか？",
  },
  {
    id: 61,
    difficulty: "intermediate",
    title: "例外の翻訳",
    description:
      "下位の例外を包む処理です。原因情報が失われる行を1つ選んでください。",
    code: [
      "public void save(Entity e) {",
      "    try {",
      "        repository.insert(e);",
      "    } catch (SQLException ex) {",
      "        throw new IllegalStateException(\"save failed\");",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "原因例外の欠落",
    explanation:
      "cause を渡さないと元の SQLException が消えます。new IllegalStateException(\"save failed\", ex) のように原因をチェーンしましょう。",
    hint: "元の例外はどこに残りますか？",
  },
  {
    id: 62,
    difficulty: "intermediate",
    title: "比較の契約",
    description:
      "ソート用の比較です。契約違反になりうる行を1つ選んでください。",
    code: [
      "public int compare(Player a, Player b) {",
      "    return a.score > b.score ? 1 : -1;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "compare で等価を返さない",
    explanation:
      "スコアが等しいときも -1 になり、compare(a,a)==0 や対称性が壊れます。等しい場合は 0 を返しましょう（Integer.compare など）。",
    hint: "同じスコアのとき何が返りますか？",
  },
  {
    id: 63,
    difficulty: "intermediate",
    title: "シングルトンの初期化",
    description:
      "設定の遅延ロードです。複数スレッドで壊れる行を選んでください。",
    code: [
      "private static Config instance;",
      "",
      "public static Config get() {",
      "    if (instance == null) {",
      "        instance = new Config();",
      "    }",
      "    return instance;",
      "}",
    ],
    antiPatternLines: [4, 5],
    patternName: "同期なしの遅延初期化",
    explanation:
      "null チェックと生成がアトミックでないため、複数インスタンスが生まれ得ます。enum シングルトンやホルダークラス、同期を検討しましょう。",
    hint: "2スレッドが同時に null を見たら？",
  },
  {
    id: 64,
    difficulty: "intermediate",
    title: "API の戻り値",
    description:
      "検索 API です。エラーと空結果の区別がつかない行を1つ選んでください。",
    code: [
      "public List<Item> search(String q) {",
      "    try {",
      "        return client.query(q);",
      "    } catch (IOException e) {",
      "        return List.of();",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "失敗を空リストで隠す",
    explanation:
      "通信失敗も「0件」に見えるため、呼び出し側が誤った判断をします。例外を伝播するか、結果型で失敗を表現しましょう。",
    hint: "本当にヒットゼロなのか、失敗なのか？",
  },
  {
    id: 65,
    difficulty: "intermediate",
    title: "時間の扱い",
    description:
      "期限切れ判定です。テストや夏時間で困りやすい行を1つ選んでください。",
    code: [
      "public boolean expired(long createdMillis) {",
      "    return System.currentTimeMillis() - createdMillis > 86_400_000;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "マジックなミリ秒と現在時刻への直依存",
    explanation:
      "86400000 の意味が読み取りにくく、現在時刻に直依存するとテストが困難です。Duration や Clock を注入しましょう。",
    hint: "1日のミリ秒だと、読んだ人はすぐ分かりますか？",
  },
  {
    id: 66,
    difficulty: "intermediate",
    title: "リストのランダムアクセス",
    description:
      "真ん中の要素を頻繁に読む処理です。データ構造の選択としてまずい行を1つ選んでください。",
    code: [
      "public String middle(LinkedList<String> items) {",
      "    return items.get(items.size() / 2);",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "LinkedList へのインデックスアクセス",
    explanation:
      "LinkedList の get(i) は先頭から辿るため O(n) です。ランダムアクセスが多いなら ArrayList を検討しましょう。",
    hint: "この get は何回のリンク辿りが必要ですか？",
  },
  {
    id: 67,
    difficulty: "intermediate",
    title: "入力ストリーム",
    description:
      "リクエストボディを読む処理です。リソースリークにつながる行を選んでください。",
    code: [
      "public String body(InputStream in) throws IOException {",
      "    BufferedReader reader = new BufferedReader(new InputStreamReader(in));",
      "    return reader.readLine();",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "Reader の未クローズ",
    explanation:
      "Reader を閉じないと、元のストリームも適切に解放されないことがあります。try-with-resources を使いましょう。",
    hint: "開いた Reader は誰が閉じますか？",
  },
  {
    id: 68,
    difficulty: "intermediate",
    title: "BigDecimal の生成",
    description:
      "金額計算の入力です。精度が崩れる行を1つ選んでください。",
    code: [
      "public BigDecimal amount(double raw) {",
      "    return new BigDecimal(raw);",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "double からの BigDecimal 生成",
    explanation:
      "new BigDecimal(0.1) は二進誤差をそのまま持ち込みます。new BigDecimal(\"0.1\") や valueOf を検討しましょう。",
    hint: "0.1 は double で正確に表せますか？",
  },
  {
    id: 69,
    difficulty: "intermediate",
    title: "スレッドの起動",
    description:
      "並列実行したい処理です。意図どおり並列にならない行を1つ選んでください。",
    code: [
      "public void runAsync(Runnable task) {",
      "    new Thread(task).run();",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "Thread#run の直接呼び出し",
    explanation:
      "run() は現在のスレッドで同期実行します。新しいスレッドで動かすには start() を呼びます。",
    hint: "別スレッドはいつ始まりますか？",
  },
  {
    id: 70,
    difficulty: "intermediate",
    title: "キャッシュのキー",
    description:
      "計算結果のキャッシュです。キーとして不適切な行を1つ選んでください。",
    code: [
      "private final Map<StringBuilder, Integer> cache = new HashMap<>();",
      "",
      "public int cachedLen(StringBuilder sb) {",
      "    return cache.computeIfAbsent(sb, s -> s.length());",
      "}",
    ],
    antiPatternLines: [1],
    patternName: "可変な StringBuilder を Map キーに",
    explanation:
      "StringBuilder は可変で equals/hashCode も内容依存のため、キー向きではありません。String など不変キーにしましょう。",
    hint: "キーの中身は後から変わり得ますか？",
  },

  // ========== 上級者 追加 (20) ==========
  {
    id: 71,
    difficulty: "advanced",
    title: "可視性の保証",
    description:
      "別スレッドから止めるフラグです。停止要求が見えないことがある読み取り行を1つ選んでください。",
    code: [
      "private boolean stopped;",
      "",
      "public void stop() {",
      "    stopped = true;",
      "}",
      "",
      "public void run() {",
      "    while (!stopped) {",
      "        work();",
      "    }",
      "}",
    ],
    antiPatternLines: [8],
    patternName: "同期なしの共有フラグ読み取り",
    explanation:
      "他スレッドが止めた stopped の更新が、同期や volatile なしではループ側から見えないことがあります。volatile や AtomicBoolean を使いましょう。",
    hint: "書き込みは、他スレッドの読み取りに必ず見えますか？",
  },
  {
    id: 72,
    difficulty: "advanced",
    title: "ロックの取り方",
    description:
      "2つの資源を扱う処理です。デッドロックを招きうる行を選んでください。",
    code: [
      "public void transfer(Account from, Account to, int amount) {",
      "    synchronized (from) {",
      "        synchronized (to) {",
      "            from.debit(amount);",
      "            to.credit(amount);",
      "        }",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 3],
    patternName: "順序不定のネストしたロック",
    explanation:
      "A→B と B→A で同時に呼ばれるとデッドロックします。口座 ID などでロック順を一意にしましょう。",
    hint: "逆順で同じメソッドが呼ばれたら？",
  },
  {
    id: 73,
    difficulty: "advanced",
    title: "wait / notify",
    description:
      "完了通知のコードです。通知が届かないことがある行を1つ選んでください。",
    code: [
      "public void signalDone() {",
      "    done = true;",
      "    notify();",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "モニタなしの notify",
    explanation:
      "notify / wait は同期中のモニタで呼ぶ必要があります。このままでは IllegalMonitorStateException か、正しい待ちと結びつきません。synchronized 内で呼びましょう。",
    hint: "このオブジェクトのロックは保持していますか？",
  },
  {
    id: 74,
    difficulty: "advanced",
    title: "スレッドの停止",
    description:
      "実行中タスクを止める処理です。危険な API を使っている行を1つ選んでください。",
    code: [
      "public void cancel(Thread worker) {",
      "    worker.stop();",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "Thread.stop の使用",
    explanation:
      "Thread.stop は非推奨・危険で、オブジェクトを不整合な状態にし得ます。割り込みフラグやキャンセル機構を使いましょう。",
    hint: "この API は今でも推奨されていますか？",
  },
  {
    id: 75,
    difficulty: "advanced",
    title: "ConcurrentHashMap の使い方",
    description:
      "カウンタを ConcurrentHashMap で持つ処理です。アトミックでない行を選んでください。",
    code: [
      "public void increment(String key) {",
      "    Integer v = map.get(key);",
      "    if (v == null) {",
      "        map.put(key, 1);",
      "    } else {",
      "        map.put(key, v + 1);",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 3, 4, 5, 6],
    patternName: "get-then-put の競合",
    explanation:
      "ConcurrentHashMap でも get と put のあいだはアトミックではありません。merge や compute を使いましょう。",
    hint: "読んだ直後に他スレッドが書けませんか？",
  },
  {
    id: 76,
    difficulty: "advanced",
    title: "発行と購読",
    description:
      "リスナー一覧です。複数スレッドから使うときに問題になりうる宣言行を1つ選んでください。",
    code: [
      "private final List<Listener> listeners = new ArrayList<>();",
      "",
      "public void fire() {",
      "    for (Listener listener : listeners) {",
      "        listener.onEvent();",
      "    }",
      "}",
    ],
    antiPatternLines: [1],
    patternName: "非スレッドセーフなリスナーリスト",
    explanation:
      "ArrayList を複数スレッドから変更・走査すると CME や欠落が起きます。CopyOnWriteArrayList や防御的コピーを検討しましょう。",
    hint: "このリストは同時アクセスに向いていますか？",
  },
  {
    id: 77,
    difficulty: "advanced",
    title: "安全でない公開",
    description:
      "ワーカースレッドへオブジェクトを渡す処理です。構築途中が見える行を1つ選んでください。",
    code: [
      "public class Server {",
      "    private Helper helper;",
      "",
      "    public void start() {",
      "        new Thread(() -> helper.use()).start();",
      "        helper = new Helper();",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "初期化前の参照の公開",
    explanation:
      "スレッドを先に起動すると、helper が null のまま、または初期化前に使われる可能性があります。代入してから start するか、コンストラクタで完全に作ってから渡しましょう。",
    hint: "スレッドはいつ helper を見に行きますか？",
  },
  {
    id: 78,
    difficulty: "advanced",
    title: "スレッドプールとローカル",
    description:
      "タスク内でコンテキストを載せる処理です。リークにつながる片付け方をしている行を1つ選んでください。",
    code: [
      "executor.execute(() -> {",
      "    CONTEXT.set(requestId);",
      "    try {",
      "        handle();",
      "    } finally {",
      "        CONTEXT.set(null);",
      "    }",
      "});",
    ],
    antiPatternLines: [6],
    patternName: "プールスレッドでの ThreadLocal 誤片付け",
    explanation:
      "スレッドプールではスレッドが再利用されるため、ThreadLocal は remove() で片付ける必要があります。set(null) ではエントリが残り、次タスクへ漏れます。",
    hint: "null を入れるだけで、前の値は消えますか？",
  },
  {
    id: 79,
    difficulty: "advanced",
    title: "ロックの粒度",
    description:
      "キャッシュ全体を守る処理です。並行性を過度に落とす行を1つ選んでください。",
    code: [
      "public synchronized Item get(String key) {",
      "    return expensiveLoad(key);",
      "}",
    ],
    antiPatternLines: [1],
    patternName: "長い処理を synchronized メソッドで直列化",
    explanation:
      "expensiveLoad 全体を同期すると、無関係なキーも待ちます。キー単位のロックや ConcurrentHashMap.compute などを検討しましょう。",
    hint: "別キーの取得も待たされますか？",
  },
  {
    id: 80,
    difficulty: "advanced",
    title: "待ちの解除",
    description:
      "条件が満たされたときの通知です。待ち側を起こせない行を1つ選んでください。",
    code: [
      "public synchronized void setReady() {",
      "    ready = true;",
      "    wait();",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "notify の代わりに wait を呼ぶ",
    explanation:
      "状態を true にしたあと wait() を呼ぶと、自分自身が待機してしまい、他スレッドを起こせません。notify や notifyAll を使いましょう。",
    hint: "待っているのは自分ですか、他のスレッドですか？",
  },
  {
    id: 81,
    difficulty: "advanced",
    title: "ハッシュと可変",
    description:
      "並列処理向けマップです。キー破壊につながる行を1つ選んでください。",
    code: [
      "ConcurrentHashMap<byte[], String> map = new ConcurrentHashMap<>();",
      "",
      "public void put(byte[] key, String value) {",
      "    map.put(key, value);",
      "    key[0] = 0;",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "put 後のキー配列変更",
    explanation:
      "配列は可変で、ハッシュ後に中身を変えるとエントリを見失います。キーは不変オブジェクトにコピーして使いましょう。",
    hint: "キーのバイト列は put 後も同じである必要があります。",
  },
  {
    id: 82,
    difficulty: "advanced",
    title: "起こす相手",
    description:
      "複数待機がある処理です。一部だけ起こしてしまう行を1つ選んでください。",
    code: [
      "public synchronized void releaseOne() {",
      "    condition = true;",
      "    notify();",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "複数待機での notify 単発",
    explanation:
      "notify は待機中の1スレッドだけを起こします。条件を待つスレッドが複数なら notifyAll が安全です（意図的な単発以外）。",
    hint: "待っているのが2人以上だと？",
  },
  {
    id: 83,
    difficulty: "advanced",
    title: "安全な公開",
    description:
      "オブジェクトを他スレッドへ渡す処理です。未初期化が見える行を1つ選んでください。",
    code: [
      "public void publish() {",
      "    Holder.h = new Holder(42);",
      "}",
      "",
      "static class Holder {",
      "    static Holder h;",
      "    int value;",
      "    Holder(int value) { this.value = value; }",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "同期なしのオブジェクト公開",
    explanation:
      "static フィールドへの代入だけでは、他スレッドが value の初期化を見ない可能性があります。volatile や final フィールド、安全な公開手段を使いましょう。",
    hint: "参照が見えたとき、中のフィールドも見えますか？",
  },
  {
    id: 84,
    difficulty: "advanced",
    title: "割り込み後の継続",
    description:
      "タスク実行ループです。割り込みを無視している行を1つ選んでください。",
    code: [
      "public void loop() {",
      "    while (true) {",
      "        try {",
      "            queue.take();",
      "        } catch (InterruptedException e) {",
      "            log.warn(\"interrupted\");",
      "        }",
      "    }",
      "}",
    ],
    antiPatternLines: [6],
    patternName: "割り込みを無視してループ継続",
    explanation:
      "InterruptedException をログだけしてループを続けると、割り込み状態も復元されずシャットダウンできません。interrupt を復元するか、ループを抜けるべきです。",
    hint: "キャンセル要求はどこへ行きますか？",
  },
  {
    id: 85,
    difficulty: "advanced",
    title: "タスクの待ち合わせ",
    description:
      "非同期結果を待つ処理です。応答なしで固まりうる行を1つ選んでください。",
    code: [
      "public Result fetch() throws Exception {",
      "    Future<Result> future = executor.submit(this::load);",
      "    return future.get();",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "タイムアウトなしの Future#get",
    explanation:
      "タイムアウトなしの get は、タスクが終わらないとスレッドを永久にブロックします。get(timeout, unit) やキャンセル方針を決めましょう。",
    hint: "相手が返ってこなかったら？",
  },
  {
    id: 86,
    difficulty: "advanced",
    title: "並列ストリーム",
    description:
      "共有リストへ書き込む処理です。データ破壊を招く行を1つ選んでください。",
    code: [
      "public List<String> collect(List<String> src) {",
      "    List<String> out = new ArrayList<>();",
      "    src.parallelStream().forEach(out::add);",
      "    return out;",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "並列ストリームから非スレッドセーフ List へ",
    explanation:
      "ArrayList はスレッドセーフでないため、parallelStream からの add で壊れます。collect(Collectors.toList()) などを使いましょう。",
    hint: "複数スレッドが同時に add していますか？",
  },
  {
    id: 87,
    difficulty: "advanced",
    title: "ロックの解放",
    description:
      "明示的ロックを使う処理です。解放漏れにつながる行を1つ選んでください。",
    code: [
      "public void critical() {",
      "    lock.lock();",
      "    try {",
      "        work();",
      "    }",
      "    lock.unlock();",
      "}",
    ],
    antiPatternLines: [6],
    patternName: "finally なしの unlock",
    explanation:
      "unlock() が try の外にあると、work() が例外を投げたときにロックが解放されません。try-finally で unlock しましょう。",
    hint: "work が例外を投げたら unlock は走りますか？",
  },
  {
    id: 88,
    difficulty: "advanced",
    title: "起こす順序",
    description:
      "完了フラグと通知です。待ち側が起きても条件を見誤る行を選んでください。",
    code: [
      "public void complete() {",
      "    synchronized (this) {",
      "        notifyAll();",
      "        done = true;",
      "    }",
      "}",
    ],
    antiPatternLines: [3, 4],
    patternName: "notify してからフラグを立てる",
    explanation:
      "先に notify すると、起き上がったスレッドがまだ done==false を見ることがあります。先に状態を更新してから notifyAll しましょう。",
    hint: "起こされた直後、条件はすでに真ですか？",
  },
  {
    id: 89,
    difficulty: "advanced",
    title: "デーモン化",
    description:
      "バックグラウンド処理の起動です。途中で強制終了されうる行を1つ選んでください。",
    code: [
      "public void startWorker(Runnable task) {",
      "    Thread t = new Thread(task);",
      "    t.setDaemon(true);",
      "    t.start();",
      "}",
    ],
    antiPatternLines: [3],
    patternName: "重要な作業のデーモンスレッド化",
    explanation:
      "デーモンスレッドは JVM 終了時に強制停止され、書き込み途中などが壊れ得ます。必須作業は非デーモンにするか、明示的なシャットダウンを設計しましょう。",
    hint: "メインが終わると、このスレッドはどうなりますか？",
  },
  {
    id: 90,
    difficulty: "advanced",
    title: "クラス初期化",
    description:
      "設定の読み込みです。デッドロックや初期化失敗を招きうる行を選んでください。",
    code: [
      "public class Config {",
      "    static final Config INSTANCE = load();",
      "",
      "    static Config load() {",
      "        return Factory.create();",
      "    }",
      "}",
      "",
      "class Factory {",
      "    static Config create() {",
      "        return Config.INSTANCE;",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 11],
    patternName: "クラス初期化中の循環参照",
    explanation:
      "Config の初期化中に Factory が Config.INSTANCE を参照すると、未初期化のまま戻ったり初期化デッドロックの原因になります。初期化を単純で一方向に保ちましょう。",
    hint: "INSTANCE が完成する前に、誰かがそれを読んでいませんか？",
  },
];
