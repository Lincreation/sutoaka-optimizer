import type { AllocationConfig, NotificationTemplate, Member, Course, CourseTarget, Group } from '../types';
import { formatISO } from '../utils/dateUtils';

export const DEFAULT_CONFIG: AllocationConfig = {
  periodStart: formatISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  periodEnd: formatISO(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
  workDesignRules: {
    defaultPerDay: 2,
    maxTotalPerPersonPerDay: 5,
    maxDaysPerWeek: 3,
  },
};

export const DEFAULT_TEMPLATE: NotificationTemplate = {
  header: 'お世話になっております。\n本日、以下の講座に予約してください。',
  footer: '予約完了したらスレッドに報告お願いします！',
};

// --- Courses ---
export const DEFAULT_COURSES: Course[] = [
  { id: '164b946c-3c48-4dc4-b222-304e45498e25', name: '林_AIライティング', url: 'https://www.street-academy.com/myclass/195410?conversion_name=direct_message&tracking_code=5e8fa382c1e54d7b34268cb86864fb94', externalId: '' },
  { id: '0996813b-2ff0-4522-9210-ee2f1b09b6ab', name: '新井_AI副業', url: 'https://www.street-academy.com/myclass/209277?conversion_name=direct_message&tracking_code=d68be3a8a63ae081e13f5f5dbc096990', externalId: '' },
  { id: 'c1', name: '講座①りんライティング', url: 'https://www.street-academy.com/myclass/192531?conversion_name=direct_message&tracking_code=5299e3c086302f2a386ae1a8eb7dc34e', externalId: '' },
  { id: 'c2', name: '講座②りんSNS', url: 'https://www.street-academy.com/myclass/202835?conversion_name=direct_message&tracking_code=129d86f3a9cc0aadb0490b1ef0cfeaef', externalId: '' },
  { id: 'c068624d-7d8b-416a-9f23-f213dbc0e693', name: '講座③りん占い', url: 'https://www.street-academy.com/myclass/192927?conversion_name=direct_message&tracking_code=8a4404473c2c8e6fd754fb76815af922', externalId: '' },
  { id: '1b338708-4776-4e21-b1b1-2e24c8784bf7', name: '講座④りん起業', url: 'https://www.street-academy.com/myclass/207058?conversion_name=direct_message&tracking_code=3de9d482bb110404bc84b081c6b868d0', externalId: '' },
  { id: 'c3', name: '講座1 渡邊_AI動画', url: 'https://www.street-academy.com/myclass/210116?conversion_name=direct_message&tracking_code=28f7f7d8836114cb4974e3f42a8d409c', externalId: '' },
  { id: 'cb20afea-ea7a-43ef-84ce-ffafa28f8bc8', name: '講座2 遠藤_在宅副業', url: 'https://www.street-academy.com/myclass/210383?conversion_name=direct_message&tracking_code=4081564bee5d6d242fe1a89490ccc4c2', externalId: '' },
  { id: 'f6347f8d-a3b2-4211-83b8-73b95cceeb9c', name: '講座3 瀧上_業務改善', url: 'https://www.street-academy.com/myclass/209965?conversion_name=direct_message&tracking_code=ea32616406d00422eec53c6a59a45b0b', externalId: '' },
  { id: '9d7f6a00-bf82-4eb8-af00-abba70fde6f2', name: '柴田_インスタ', url: 'https://www.street-academy.com/myclass/200544?conversion_name=direct_message&tracking_code=c06b1f0a5edf258499bc98de02f6ab21', externalId: '' },
  { id: '98179ed1-9c93-4fa1-95b9-e760fcf39b16', name: '【廃止】たいよう_Ai動画', url: 'https://www.street-academy.com/myclass/196730?conversion_name=direct_message&tracking_code=4687e64a47372fca649477e4a0ca8392', externalId: '' },
  { id: 'e252c024-2b17-4321-ab5c-36d3c29b5f3a', name: '竹内_占い', url: 'https://www.street-academy.com/myclass/207848?conversion_name=direct_message&tracking_code=1364ae98529c43019b9bb0d2a53636a1', externalId: '' },
  { id: '9ddbcf84-84b5-4a88-938c-679cb79a3ff8', name: '竹内_コンサル', url: 'https://www.street-academy.com/myclass/207851?conversion_name=direct_message&tracking_code=16bd43ca83bb72db9c6b1a2dd3ce5704', externalId: '' },
];

// --- Course Targets ---
export const DEFAULT_COURSE_TARGETS: CourseTarget[] = [
  { courseId: '164b946c-3c48-4dc4-b222-304e45498e25', targetCount: 20, perDay: 1 },
  { courseId: '0996813b-2ff0-4522-9210-ee2f1b09b6ab', targetCount: 40, perDay: 1 },
  { courseId: 'c1', targetCount: 50, perDay: 1 },
  { courseId: 'c2', targetCount: 50, perDay: 1 },
  { courseId: 'c068624d-7d8b-416a-9f23-f213dbc0e693', targetCount: 50, perDay: 1 },
  { courseId: '1b338708-4776-4e21-b1b1-2e24c8784bf7', targetCount: 50, perDay: 1 },
  { courseId: 'c3', targetCount: 40, perDay: 1 },
  { courseId: 'cb20afea-ea7a-43ef-84ce-ffafa28f8bc8', targetCount: 40, perDay: 1 },
  { courseId: 'f6347f8d-a3b2-4211-83b8-73b95cceeb9c', targetCount: 40, perDay: 1 },
  { courseId: '9d7f6a00-bf82-4eb8-af00-abba70fde6f2', targetCount: 50, perDay: 1 },
  { courseId: '98179ed1-9c93-4fa1-95b9-e760fcf39b16', targetCount: 0, perDay: 1 },
  { courseId: 'e252c024-2b17-4321-ab5c-36d3c29b5f3a', targetCount: 70, perDay: 1 },
  { courseId: '9ddbcf84-84b5-4a88-938c-679cb79a3ff8', targetCount: 40, perDay: 1 },
];

// --- Groups ---
const GRP_1000EN = 'grp-1000en';
const GRP_KOSAN_ARAI = 'grp-kosan-arai';
const GRP_SHINKI_TAKEUCHI = 'grp-shinki-takeuchi';

export const DEFAULT_GROUPS: Group[] = [
  {
    id: GRP_1000EN,
    name: '1000円講座',
    eligibleCourseIds: [
      'c2',                                       // 講座②りんSNS
      'c068624d-7d8b-416a-9f23-f213dbc0e693',     // 講座③りん占い
      'e252c024-2b17-4321-ab5c-36d3c29b5f3a',     // 竹内_占い
      'c3',                                       // 講座1 渡邊_AI動画
    ],
    slackChannelId: '',
  },
  {
    id: GRP_KOSAN_ARAI,
    name: '古参＋新井',
    eligibleCourseIds: [
      '1b338708-4776-4e21-b1b1-2e24c8784bf7',     // 講座④りん起業
      '0996813b-2ff0-4522-9210-ee2f1b09b6ab',     // 新井_AI副業
      '164b946c-3c48-4dc4-b222-304e45498e25',     // 林_AIライティング
      '9d7f6a00-bf82-4eb8-af00-abba70fde6f2',     // 柴田_インスタ
      'c1',                                       // 講座①りんライティング
    ],
    slackChannelId: '',
  },
  {
    id: GRP_SHINKI_TAKEUCHI,
    name: '新規＋竹内',
    eligibleCourseIds: [
      'cb20afea-ea7a-43ef-84ce-ffafa28f8bc8',     // 講座2 遠藤_在宅副業
      'f6347f8d-a3b2-4211-83b8-73b95cceeb9c',     // 講座3 瀧上_業務改善
      '9ddbcf84-84b5-4a88-938c-679cb79a3ff8',     // 竹内_コンサル
    ],
    slackChannelId: '',
  },
];

// --- Members ---
export const DEFAULT_MEMBERS: Member[] = [
  { id: 'member_001', name: '井出 美都子', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09D156EG1J', slackName: 'MIYA', isActive: true },
  { id: 'member_002', name: '杉浦 ゆかり', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09QQG981ND', slackName: 'yui', isActive: true },
  { id: 'member_003', name: '大木 雄太', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09M21HREBV', slackName: '大木雄太', isActive: false },
  { id: 'member_004', name: '田口 昇', groupId: GRP_KOSAN_ARAI, slackUserId: 'U094NEY3BU6', slackName: 'Nobo', isActive: true },
  { id: 'member_005', name: '土方 康司', groupId: GRP_KOSAN_ARAI, slackUserId: 'U0A8UTEGWFR', slackName: 'yasushi caffeine', isActive: true },
  { id: 'member_006', name: '東海 林由架', groupId: GRP_1000EN, slackUserId: 'U08JA497FTR', slackName: 'ゆゆ', isActive: true },
  { id: 'member_007', name: '平田 良子', groupId: GRP_1000EN, slackUserId: 'U097M77D6MU', slackName: 'よっしー', isActive: false },
  { id: 'member_008', name: '中村 一彦', groupId: GRP_1000EN, slackUserId: 'U08SZKSMGFN', slackName: 'みぃぴこ', isActive: true },
  { id: 'member_009', name: '小川 芳華', groupId: GRP_1000EN, slackUserId: 'U07JVD6U3TK', slackName: '小川', isActive: true },
  { id: 'member_010', name: '野城 紗唯奈', groupId: GRP_1000EN, slackUserId: 'U07TY5RGUF5', slackName: 'Hibi', isActive: true },
  { id: 'member_011', name: '高橋 聖和', groupId: GRP_1000EN, slackUserId: 'U091S244UKF', slackName: 'アニキ', isActive: true },
  { id: 'member_012', name: '野尻 幸樹実', groupId: GRP_1000EN, slackUserId: 'U0934RDM6TH', slackName: 'lily', isActive: true },
  { id: 'member_013', name: '国枝 伶奈', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09D1LUQHLP', slackName: 'reina', isActive: true },
  { id: 'member_014', name: '笹原 あゆみ', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09K5RNHTL1', slackName: 'YUN', isActive: true },
  { id: 'member_015', name: '小柳 隆夫', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09F1MDLV7Z', slackName: 'Takao Koyanagi', isActive: true },
  { id: 'member_016', name: '荻野 賀子', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09LGJB97KM', slackName: '荻野賀子', isActive: true },
  { id: 'member_017', name: '河野 茜', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09MC5TNYJG', slackName: '茜（あかね）', isActive: true },
  { id: 'member_018', name: '井口 聡', groupId: GRP_KOSAN_ARAI, slackUserId: 'U09KY4X14DR', slackName: '井口聡/ぽんぽこAI', isActive: true },
  { id: 'member_019', name: '面田 夏美', groupId: GRP_KOSAN_ARAI, slackUserId: 'U07J547LTF0', slackName: 'natsumi', isActive: true },
  { id: 'member_020', name: '渡辺 琉', groupId: GRP_KOSAN_ARAI, slackUserId: 'U07LMFEUU5V', slackName: 'Bean（AI講師）', isActive: false },
  { id: 'member_022', name: '佐野 景子', groupId: GRP_1000EN, slackUserId: 'U09M52R2B1D', slackName: 'Keiko', isActive: true },
  { id: 'member_023', name: '國貞 美佐子', groupId: GRP_1000EN, slackUserId: 'U09M5J0QX52', slackName: 'クニサダ', isActive: true },
  { id: 'member_024', name: '泉 博美', groupId: GRP_1000EN, slackUserId: 'U092Y5YNPMX', slackName: 'クーちゃん', isActive: true },
  { id: 'member_025', name: '杉本奈津枝', groupId: GRP_1000EN, slackUserId: 'U09NPG1UFFU', slackName: 'なちこ', isActive: true },
  { id: 'member_026', name: '小谷 千津', groupId: GRP_SHINKI_TAKEUCHI, slackUserId: 'U09H9DY8ATW', slackName: '菜花', isActive: true },
  { id: 'member_027', name: '越川 幸江', groupId: GRP_SHINKI_TAKEUCHI, slackUserId: 'U09QNUV0RRA', slackName: 'コッシー', isActive: true },
  { id: 'member_028', name: '和田 恵太', groupId: GRP_SHINKI_TAKEUCHI, slackUserId: 'U09V4GZSG9F', slackName: 'keita', isActive: true },
  { id: 'member_029', name: '渡邊 佳紀', groupId: GRP_SHINKI_TAKEUCHI, slackUserId: 'U0AAUD5ATQS', slackName: '渡邊 佳紀', isActive: true },
  { id: 'member_030', name: '坂本 徳子', groupId: GRP_SHINKI_TAKEUCHI, slackUserId: '', slackName: 'tokuko', isActive: true },
  { id: 'member_031', name: '山崎 史宣', groupId: GRP_1000EN, slackUserId: 'U09V3S9A3AB', slackName: 'shinobu', isActive: true },
  { id: 'member_032', name: '桑代 智章', groupId: GRP_1000EN, slackUserId: 'U0A7NDVR2JC', slackName: '桑代 智章', isActive: true },
  { id: 'member_040', name: '関根 祐子', groupId: GRP_SHINKI_TAKEUCHI, slackUserId: 'U0ACUSL5P70', slackName: 'ゆーこ', isActive: true },
  { id: 'member_042', name: '森貴明', groupId: GRP_KOSAN_ARAI, slackUserId: 'U0AH4G92JKX', slackName: '森貴明', isActive: true },
  { id: 'member_043', name: '大岩力哉', groupId: GRP_KOSAN_ARAI, slackUserId: 'U0ABK9JA81F', slackName: '大岩力哉', isActive: true },
  { id: 'member_044', name: '水野駿也', groupId: GRP_SHINKI_TAKEUCHI, slackUserId: 'U0ABK9JA81F', slackName: '水野駿也', isActive: true },
];
