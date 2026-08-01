import { moreQuestions } from "./moreQuestions";
import type { Difficulty, QuizQuestion } from "./quizTypes";

export type { Difficulty, QuizQuestion } from "./quizTypes";

export function getSelectionGuide(question: QuizQuestion): string {
  if (question.antiPatternLines.length === 1) {
    return "該当する行を1つ選んでください。";
  }
  return "該当する行を選んでください。同種の問題が複数ある場合は、1行でもすべてでも構いません。";
}

/** 空行や括弧だけの行は誤選択とみなさない */
export function isIgnorableLine(code: string): boolean {
  const trimmed = code.trim();
  return (
    trimmed === "" ||
    trimmed === "{" ||
    trimmed === "}" ||
    trimmed === "};" ||
    trimmed === "},"
  );
}

/**
 * 採点: 正解行を1行以上含み、かつ正解以外の実質的な行を選んでいなければ正解。
 * 完全一致は求めない（同種の複数行は代表1行でも可）。
 */
export function isSelectionCorrect(
  selected: Set<number>,
  answerLines: number[],
  code: string[],
): boolean {
  if (selected.size === 0) return false;

  const answers = new Set(answerLines);
  let hit = false;

  for (const line of selected) {
    if (answers.has(line)) {
      hit = true;
      continue;
    }
    const content = code[line - 1] ?? "";
    if (isIgnorableLine(content)) continue;
    return false;
  }

  return hit;
}

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; description: string; color: string }
> = {
  beginner: {
    label: "初心者",
    description: "文法・基本的な落とし穴",
    color: "beginner",
  },
  intermediate: {
    label: "中級者",
    description: "設計・API・よくある実務ミス",
    color: "intermediate",
  },
  advanced: {
    label: "上級者",
    description: "並行性・高度な落とし穴",
    color: "advanced",
  },
};

export const questions: QuizQuestion[] = [
  // ========== 初心者 (30) ==========
  {
    id: 1,
    difficulty: "beginner",
    title: "文字列の比較",
    description:
      "ユーザー名を検証するメソッドです。意図どおりに動かないことがある比較処理を含む行を1つ選んでください。",
    code: [
      "public boolean isAdmin(String username) {",
      "    if (username == \"admin\") {",
      "        return true;",
      "    }",
      "    return false;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "== による String 比較",
    explanation:
      "String の内容比較には == ではなく equals() を使います。== は参照の同一性を比較するため、意図しない結果になります。",
    hint: "オブジェクトの等価性と参照の同一性は別物です。",
  },
  {
    id: 2,
    difficulty: "beginner",
    title: "マジックナンバー",
    description:
      "ユーザーの年齢を判定するメソッドです。可読性・保守性の観点でアンチパターンの行を選んでください。",
    code: [
      "public String getAgeGroup(int age) {",
      "    if (age < 20) {",
      "        return \"teen\";",
      "    } else if (age < 65) {",
      "        return \"adult\";",
      "    }",
      "    return \"senior\";",
      "}",
    ],
    antiPatternLines: [2, 4],
    patternName: "マジックナンバー",
    explanation:
      "20 や 65 といった意味のある数値がコード中に直接書かれています。定数として名前を付け、意図を明確にすべきです。",
    hint: "この数字は何を表していますか？",
  },
  {
    id: 3,
    difficulty: "beginner",
    title: "ループ内での文字列連結",
    description:
      "ログメッセージを組み立てる処理です。パフォーマンス上問題のある行を1つ選んでください。",
    code: [
      "public String buildLog(List<String> items) {",
      "    String result = \"\";",
      "    for (String item : items) {",
      "        result = result + item + \",\";",
      "    }",
      "    return result;",
      "}",
    ],
    antiPatternLines: [4],
    patternName: "ループ内での String 連結",
    explanation:
      "ループ内で + による文字列連結を繰り返すと、毎回新しい String が生成されます。StringBuilder や String.join() を使いましょう。",
    hint: "不変オブジェクトを繰り返し作り直していませんか？",
  },
  {
    id: 4,
    difficulty: "beginner",
    title: "例外の握りつぶし",
    description:
      "ファイル読み込み処理です。エラー時に呼び出し側を誤解させうる行を選んでください。",
    code: [
      "public String readFile(Path path) {",
      "    try {",
      "        return Files.readString(path);",
      "    } catch (IOException e) {",
      "        return \"\";",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "例外の握りつぶし",
    explanation:
      "catch 内で空文字を返すと、読み込み失敗を成功のように見せてしまいます。ログ出力・再スロー・適切な代替処理を行いましょう。",
    hint: "失敗を成功のように見せていませんか？",
  },
  {
    id: 5,
    difficulty: "beginner",
    title: "null の返却",
    description:
      "ユーザーを検索するメソッドです。呼び出し側の安全性を損ないうる戻り方をしている行を1つ選んでください。",
    code: [
      "public User findUserById(Long id) {",
      "    for (User user : users) {",
      "        if (Objects.equals(user.getId(), id)) {",
      "            return user;",
      "        }",
      "    }",
      "    return null;",
      "}",
    ],
    antiPatternLines: [7],
    patternName: "null の返却",
    explanation:
      "見つからない場合に null を返すと、呼び出し側で NullPointerException が起きやすくなります。Optional<User> を返すか、例外を投げる設計が推奨されます。",
    hint: "呼び出し側は毎回 null チェックが必要になります。",
  },
  {
    id: 6,
    difficulty: "beginner",
    title: "ログの出し方",
    description:
      "エラー情報を出力する処理です。運用上好ましくない出力方法を使っている行を1つ選んでください。",
    code: [
      "public void handleError(Exception e) {",
      "    System.out.println(\"Error: \" + e.getMessage());",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "System.out によるログ出力",
    explanation:
      "本番コードでは System.out / System.err ではなく、ロギングフレームワーク（SLF4J など）を使います。ログレベル・出力先・フォーマットを制御できないためです。",
    hint: "本番環境で標準出力に頼るのは適切ですか？",
  },
  {
    id: 7,
    difficulty: "beginner",
    title: "null 呼び出しの equals",
    description:
      "入力文字列を検証する処理です。実行時例外を招きうる行を1つ選んでください。",
    code: [
      "public boolean isYes(String input) {",
      "    return input.equals(\"yes\");",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "null になりうるオブジェクトへの equals",
    explanation:
      "input が null のとき NPE になります。\"yes\".equals(input) とするか、Objects.equals(input, \"yes\") を使いましょう。",
    hint: "引数が null だったらどうなりますか？",
  },
  {
    id: 8,
    difficulty: "beginner",
    title: "数値の比較",
    description:
      "計算結果を比較する処理です。数値の性質を考慮していない比較をしている行を1つ選んでください。",
    code: [
      "public boolean isOne(double value) {",
      "    return value == 1.0;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "浮動小数点の == 比較",
    explanation:
      "double / float は誤差があるため == での等価比較は危険です。許容誤差を決めて Math.abs(a - b) < epsilon のように比較します。",
    hint: "0.1 + 0.2 はちょうど 0.3 になりますか？",
  },
  {
    id: 9,
    difficulty: "beginner",
    title: "分岐のつながり",
    description:
      "ステータスに応じてメッセージを返す処理です。意図しない分岐につながる行を1つ選んでください。",
    code: [
      "public String label(int status) {",
      "    String pending = null;",
      "    switch (status) {",
      "        case 1:",
      "            return \"OK\";",
      "        case 2:",
      "            pending = \"WARN\";",
      "        case 3:",
      "            return pending != null ? pending : \"NG\";",
      "        default:",
      "            return \"UNKNOWN\";",
      "    }",
      "}",
    ],
    antiPatternLines: [7],
    patternName: "break / return 忘れによるフォールスルー",
    explanation:
      "case 2 で return も break もないため、pending を設定したあと case 3 に落ちて意図しない戻り値になります。各 case を明示的に終了させましょう。",
    hint: "case 2 の処理のあと、switch はどこへ進みますか？",
  },
  {
    id: 10,
    difficulty: "beginner",
    title: "フィールドの公開範囲",
    description:
      "ユーザー情報を表すクラスです。カプセル化を破る行を選んでください。",
    code: [
      "public class User {",
      "    public String name;",
      "    public int age;",
      "}",
    ],
    antiPatternLines: [2, 3],
    patternName: "public な可変フィールド",
    explanation:
      "フィールドを public にすると、どこからでも直接変更でき、不変条件を守れません。private にして getter / setter（または不変オブジェクト）で公開しましょう。",
    hint: "外部から好きに書き換えられていませんか？",
  },

  // ========== 中級者 (30) ==========
  {
    id: 11,
    difficulty: "intermediate",
    title: "リソースの寿命",
    description:
      "データベース接続を使う処理です。リソースリークにつながる行を選んでください。",
    code: [
      "public void exportData(Connection conn) throws SQLException {",
      "    Statement stmt = conn.createStatement();",
      "    ResultSet rs = stmt.executeQuery(\"SELECT * FROM users\");",
      "    while (rs.next()) {",
      "        System.out.println(rs.getString(\"name\"));",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 3],
    patternName: "リソースの未クローズ",
    explanation:
      "このメソッドで生成した Statement と ResultSet はクローズされていません。try-with-resources で囲みましょう。（引数の Connection は呼び出し側の管理対象です。）",
    hint: "このメソッドで開いたリソースは閉じる責務があります。",
  },
  {
    id: 12,
    difficulty: "intermediate",
    title: "共有される設定値",
    description:
      "設定値を保持するクラスです。カプセル化を破る行を選んでください。",
    code: [
      "public class AppConfig {",
      "    public static int MAX_RETRY = 3;",
      "    public static boolean DEBUG_MODE = true;",
      "}",
    ],
    antiPatternLines: [2, 3],
    patternName: "可変な public static フィールド",
    explanation:
      "public static かつ可変なフィールドはグローバル変数のようにどこからでも変更でき、予測不能になります。",
    hint: "グローバル変数のような状態は危険です。",
  },
  {
    id: 13,
    difficulty: "intermediate",
    title: "コレクションの型",
    description:
      "コレクションを扱うコードです。型安全性を失う原因となっている宣言行を1つ選んでください。",
    code: [
      "public void processItems() {",
      "    List items = new ArrayList();",
      "    items.add(\"hello\");",
      "    items.add(42);",
      "    String first = (String) items.get(0);",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "Raw Type の使用",
    explanation:
      "ジェネリクスを省略した List items = new ArrayList() は Raw Type です。異種追加やキャストの原因になります。List<String> のように型引数を指定しましょう。",
    hint: "後続の問題は、どの宣言から生じていますか？",
  },
  {
    id: 14,
    difficulty: "intermediate",
    title: "equals の実装",
    description:
      "値オブジェクトの equals 実装です。実行時エラーを招きうる行を1つ選んでください。",
    code: [
      "public class Item {",
      "    private final String id;",
      "",
      "    @Override",
      "    public boolean equals(Object obj) {",
      "        Item other = (Item) obj;",
      "        return Objects.equals(this.id, other.id);",
      "    }",
      "}",
    ],
    antiPatternLines: [6],
    patternName: "instanceof チェックなしのキャスト",
    explanation:
      "equals ではキャスト前に instanceof で型を確認する必要があります。確認なしの (Item) obj は ClassCastException を起こします。",
    hint: "null や別の型が渡されたときどうなりますか？",
  },
  {
    id: 15,
    difficulty: "intermediate",
    title: "例外の捕捉範囲",
    description:
      "ネットワーク処理です。例外の取り扱いとして広すぎる行を1つ選んでください。",
    code: [
      "public void fetch() {",
      "    try {",
      "        client.send(request);",
      "    } catch (Exception e) {",
      "        logger.warn(\"failed\", e);",
      "    }",
      "}",
    ],
    antiPatternLines: [4],
    patternName: "Exception の一括キャッチ",
    explanation:
      "Exception をまとめて捕まえると、想定外の実行時例外やプログラミングエラーまで握りつぶしやすくなります。扱う例外を具体的に書きましょう。",
    hint: "本当にすべての Exception を同じ扱いしてよいですか？",
  },
  {
    id: 16,
    difficulty: "intermediate",
    title: "内部コレクションの露出",
    description:
      "メンバー一覧を返すメソッドです。内部状態が外から変更できてしまう行を1つ選んでください。",
    code: [
      "public class Team {",
      "    private final List<String> members = new ArrayList<>();",
      "",
      "    public List<String> getMembers() {",
      "        return members;",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "可変内部状態の直接返却",
    explanation:
      "内部の List をそのまま返すと、呼び出し側が add/remove できて不変条件が壊れます。Collections.unmodifiableList や防御的コピーを返しましょう。",
    hint: "返したリストは外から変更できませんか？",
  },
  {
    id: 17,
    difficulty: "intermediate",
    title: "ラップ型の比較",
    description:
      "ID を比較する処理です。オブジェクトの比較として問題のある行を1つ選んでください。",
    code: [
      "public boolean sameId(Integer a, Integer b) {",
      "    return a == b;",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "Integer の == 比較",
    explanation:
      "Integer の == は参照比較です。-128〜127 以外では別インスタンスになりやすく、意図しない false になります。Objects.equals(a, b) や equals を使いましょう。",
    hint: "オートボクシング後の参照は常に同一ですか？",
  },
  {
    id: 18,
    difficulty: "intermediate",
    title: "クエリの組み立て",
    description:
      "ユーザー検索のクエリ組み立てです。セキュリティ上問題のある行を1つ選んでください。",
    code: [
      "public User findByName(String name) throws SQLException {",
      "    String sql = \"SELECT * FROM users WHERE name = '\" + name + \"'\";",
      "    try (Statement stmt = conn.createStatement();",
      "         ResultSet rs = stmt.executeQuery(sql)) {",
      "        if (rs.next()) {",
      "            return map(rs);",
      "        }",
      "        return null;",
      "    }",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "SQL インジェクション（文字列連結）",
    explanation:
      "ユーザー入力を SQL に直接連結すると SQL インジェクションの危険があります。PreparedStatement のプレースホルダを使いましょう。",
    hint: "name に悪意ある文字列が入ったら？",
  },
  {
    id: 19,
    difficulty: "intermediate",
    title: "Map のキー",
    description:
      "キャッシュ用の Map です。登録したデータをあとから取り出せなくなる操作をしている行を1つ選んでください。",
    code: [
      "static class MutableKey {",
      "    int id;",
      "}",
      "",
      "Map<MutableKey, String> cache = new HashMap<>();",
      "",
      "public void put(MutableKey key, String value) {",
      "    cache.put(key, value);",
      "    key.id = 0;",
      "}",
    ],
    antiPatternLines: [9],
    patternName: "可変オブジェクトを Map のキーに変更",
    explanation:
      "HashMap のキーは put 後にハッシュ値が変わってはいけません。key.id を書き換えるとエントリを探せなくなります。キーは不変オブジェクトにしましょう。",
    hint: "put のあとキーの中身を変えていませんか？",
  },
  {
    id: 20,
    difficulty: "intermediate",
    title: "toString での重い処理",
    description:
      "デバッグ用の文字列化です。このメソッドの役割として好ましくない処理を含む行を1つ選んでください。",
    code: [
      "public class Order {",
      "    private final long id;",
      "",
      "    @Override",
      "    public String toString() {",
      "        return \"Order(\" + id + \", items=\" + repository.findItems(id) + \")\";",
      "    }",
      "}",
    ],
    antiPatternLines: [6],
    patternName: "toString 内の副作用・重い処理",
    explanation:
      "toString はログやデバッガから頻繁に呼ばれます。DB アクセスなどの副作用や重い処理を入れると、性能劣化や想定外の例外を招きます。",
    hint: "ログ出力のたびに DB に問い合わせていませんか？",
  },

  // ========== 上級者 (30) ==========
  {
    id: 21,
    difficulty: "advanced",
    title: "割り込みの扱い",
    description:
      "スレッドを待機する処理です。割り込みを正しく扱えていない行を1つ選んでください。",
    code: [
      "public void waitForTask() {",
      "    try {",
      "        Thread.sleep(1000);",
      "    } catch (InterruptedException e) {",
      "        e.printStackTrace();",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "InterruptedException の握りつぶし",
    explanation:
      "InterruptedException をキャッチしたら、Thread.currentThread().interrupt() で割り込み状態を復元するか、上位に伝播させるべきです。",
    hint: "スレッドの割り込みフラグはどうなりますか？",
  },
  {
    id: 22,
    difficulty: "advanced",
    title: "遅延初期化",
    description:
      "遅延初期化のシングルトンです。複数スレッドで問題になりうる読み取りをしている行を1つ選んでください。",
    code: [
      "private static Helper helper;",
      "",
      "public static Helper getHelper() {",
      "    if (helper == null) {",
      "        synchronized (HelperFactory.class) {",
      "            if (helper == null) {",
      "                helper = new Helper();",
      "            }",
      "        }",
      "    }",
      "    return helper;",
      "}",
    ],
    antiPatternLines: [4],
    patternName: "同期なしでの共有変数読み取り",
    explanation:
      "外側の if (helper == null) は synchronized の外で helper を読むため、他スレッドの書き込みが見えず未初期化参照の危険があります。volatile 付きフィールドにするか、ホルダークラス／enum シングルトンを使いましょう。",
    hint: "最初の null チェックは synchronized の内側ですか？",
  },
  {
    id: 23,
    difficulty: "advanced",
    title: "残高の更新",
    description:
      "残高チェック後に出金する処理です。スレッドセーフでない原因の行を選んでください。",
    code: [
      "public void withdraw(int amount) {",
      "    if (balance >= amount) {",
      "        balance -= amount;",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 3],
    patternName: "非アトミックな check-then-act",
    explanation:
      "残高確認と減算の間に他スレッドが割り込むと、残高が負になり得ます。synchronized や AtomicInteger、ロックで一連の操作をアトミックにしましょう。",
    hint: "if と代入のあいだに何が起き得ますか？",
  },
  {
    id: 24,
    difficulty: "advanced",
    title: "条件待ち",
    description:
      "条件待ちのコードです。待機の書き方として不十分な行を1つ選んでください。",
    code: [
      "public synchronized void awaitReady() throws InterruptedException {",
      "    if (!ready) {",
      "        wait();",
      "    }",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "wait を if で呼ぶ",
    explanation:
      "wait はスプリアスウェイクアップや通知の取りこぼしがあるため、条件が満たされるまで while ループで待つ必要があります。if では不十分です。",
    hint: "一度起きたら条件は必ず真ですか？",
  },
  {
    id: 25,
    difficulty: "advanced",
    title: "走査と削除",
    description:
      "リストから要素を削除する処理です。走査中にコレクションを変更している行を1つ選んでください。",
    code: [
      "public void removeInvalid(List<String> items) {",
      "    for (String item : items) {",
      "        if (item.isEmpty()) {",
      "            items.remove(item);",
      "        }",
      "    }",
      "}",
    ],
    antiPatternLines: [4],
    patternName: "拡張 for 中のコレクション変更",
    explanation:
      "拡張 for（イテレータ）の走査中に List.remove すると ConcurrentModificationException になります。Iterator.remove() や removeIf を使いましょう。",
    hint: "走査中に構造を変えていませんか？",
  },
  {
    id: 26,
    difficulty: "advanced",
    title: "日付フォーマット",
    description:
      "日付フォーマット用のフィールドです。複数スレッドから使うときに問題になる行を選んでください。",
    code: [
      "public class DateUtil {",
      "    private static final SimpleDateFormat FORMAT =",
      "        new SimpleDateFormat(\"yyyy-MM-dd\");",
      "",
      "    public static String format(Date date) {",
      "        return FORMAT.format(date);",
      "    }",
      "}",
    ],
    antiPatternLines: [2, 3, 6],
    patternName: "スレッドセーフでない SimpleDateFormat の共有",
    explanation:
      "SimpleDateFormat はスレッドセーフではありません。static フィールドで共有し、format() から呼び出すと複数スレッドで壊れた結果や例外が出ます。DateTimeFormatter（java.time）や ThreadLocal を検討しましょう。",
    hint: "このフォーマッタは複数スレッドから同時に使われます。",
  },
  {
    id: 27,
    difficulty: "advanced",
    title: "ロックの選び方",
    description:
      "ロックの選び方です。他のコードと意図せずロックを共有しうる宣言行を1つ選んでください。",
    code: [
      "private Boolean lock = Boolean.FALSE;",
      "",
      "public void critical() {",
      "    synchronized (lock) {",
      "        doWork();",
      "    }",
      "}",
    ],
    antiPatternLines: [1],
    patternName: "ボックス化型への同期",
    explanation:
      "Boolean.FALSE などの共有インスタンスに同期すると、無関係なコードとロックが衝突し得ます。専用の private final Object lock = new Object() を使いましょう。",
    hint: "この lock オブジェクトは JVM 全体で共有され得ます。",
  },
  {
    id: 28,
    difficulty: "advanced",
    title: "スレッド固有データの寿命",
    description:
      "リクエスト単位のコンテキスト保持です。スレッド再利用時に不具合につながる片付け方をしている行を1つ選んでください。",
    code: [
      "private static final ThreadLocal<User> CURRENT = new ThreadLocal<>();",
      "",
      "public void handle(User user) {",
      "    CURRENT.set(user);",
      "    try {",
      "        process();",
      "    } finally {",
      "        CURRENT.set(null);",
      "    }",
      "}",
    ],
    antiPatternLines: [8],
    patternName: "ThreadLocal の誤った片付け",
    explanation:
      "ThreadLocal は set(null) ではなく remove() で片付ける必要があります。set(null) でもエントリが残り、スレッドプール再利用時にメモリリークや情報漏洩の原因になります。",
    hint: "null を入れることと、ThreadLocal 自体を外すことは同じですか？",
  },
  {
    id: 29,
    difficulty: "advanced",
    title: "リソース解放のタイミング",
    description:
      "ネイティブリソース解放の実装です。現代の Java で推奨されない手法を使っている行を1つ選んでください。",
    code: [
      "public class NativeBuffer {",
      "    private long peer;",
      "",
      "    @Override",
      "    protected void finalize() {",
      "        free(peer);",
      "    }",
      "}",
    ],
    antiPatternLines: [5],
    patternName: "finalize によるリソース解放",
    explanation:
      "finalize は呼び出しタイミングが不定で、Java 9 以降非推奨です。リソース解放に頼るべきではありません。AutoCloseable と try-with-resources、または Cleaner を使いましょう。",
    hint: "ガベージコレクションに頼る解放はいつ走りますか？",
  },
  {
    id: 30,
    difficulty: "advanced",
    title: "ロックの公開範囲",
    description:
      "同期に使うロックの定義です。外部から介入されうる設計になっている行を1つ選んでください。",
    code: [
      "public class Counter {",
      "    public final Object lock = new Object();",
      "    private int value;",
      "",
      "    public void increment() {",
      "        synchronized (lock) {",
      "            value++;",
      "        }",
      "    }",
      "}",
    ],
    antiPatternLines: [2],
    patternName: "公開されたロックオブジェクト",
    explanation:
      "lock が public だと、外部コードが同じオブジェクトで synchronized でき、デッドロックや予期しないブロッキングの原因になります。private final にしましょう。",
    hint: "誰でもこのロックを取得できてしまいます。",
  },
  ...moreQuestions,
];

export function getQuestionsByDifficulty(difficulty: Difficulty): QuizQuestion[] {
  return questions.filter((q) => q.difficulty === difficulty);
}

export function countByDifficulty(difficulty: Difficulty): number {
  return getQuestionsByDifficulty(difficulty).length;
}

export function shuffleQuestions<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
