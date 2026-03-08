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
  { id: '98179ed1-9c93-4fa1-95b9-e760fcf39b16', name: 'たいよう_Ai動画', url: 'https://www.street-academy.com/myclass/196730?conversion_name=direct_message&tracking_code=4687e64a47372fca649477e4a0ca8392', externalId: '' },
  { id: 'e252c024-2b17-4321-ab5c-36d3c29b5f3a', name: '竹内_占い', url: 'https://www.street-academy.com/myclass/207848?conversion_name=direct_message&tracking_code=1364ae98529c43019b9bb0d2a53636a1', externalId: '' },
  { id: '9ddbcf84-84b5-4a88-938c-679cb79a3ff8', name: '竹内_コンサル', url: 'https://www.street-academy.com/myclass/207851?conversion_name=direct_message&tracking_code=16bd43ca83bb72db9c6b1a2dd3ce5704', externalId: '' },
];

// --- Course Targets ---
export const DEFAULT_COURSE_TARGETS: CourseTarget[] = [
  { courseId: 'c1', targetCount: 50, perDay: 3 },
  { courseId: 'c2', targetCount: 50, perDay: 3 },
  { courseId: 'c3', targetCount: 40, perDay: 2 },
  { courseId: 'c068624d-7d8b-416a-9f23-f213dbc0e693', targetCount: 50, perDay: 2 },
  { courseId: '1b338708-4776-4e21-b1b1-2e24c8784bf7', targetCount: 50, perDay: 3 },
  { courseId: 'cb20afea-ea7a-43ef-84ce-ffafa28f8bc8', targetCount: 40, perDay: 2 },
  { courseId: 'f6347f8d-a3b2-4211-83b8-73b95cceeb9c', targetCount: 40, perDay: 2 },
  { courseId: '164b946c-3c48-4dc4-b222-304e45498e25', targetCount: 20, perDay: 2 },
  { courseId: '9d7f6a00-bf82-4eb8-af00-abba70fde6f2', targetCount: 50, perDay: 3 },
  { courseId: '98179ed1-9c93-4fa1-95b9-e760fcf39b16', targetCount: 40, perDay: 3 },
  { courseId: 'e252c024-2b17-4321-ab5c-36d3c29b5f3a', targetCount: 70, perDay: 3 },
  { courseId: '9ddbcf84-84b5-4a88-938c-679cb79a3ff8', targetCount: 40, perDay: 3 },
  { courseId: '0996813b-2ff0-4522-9210-ee2f1b09b6ab', targetCount: 40, perDay: 2 },
];

// --- Groups ---
const GRP_1000EN = 'grp-1000en';
const GRP_KOSAN_ARAI = 'grp-kosan-arai';
const GRP_SHINKI_TAKEUCHI = 'grp-shinki-takeuchi';
const GRP_NN = 'grp-nn';
const GRP_TAKEUCHI = 'grp-takeuchi';

export const DEFAULT_GROUPS: Group[] = [
  {
    id: GRP_1000EN,
    name: '1000円講座',
    eligibleCourseIds: ['c1', 'c2', 'c068624d-7d8b-416a-9f23-f213dbc0e693', '1b338708-4776-4e21-b1b1-2e24c8784bf7'],
    slackChannelId: 'C0123456789',
  },
  {
    id: GRP_KOSAN_ARAI,
    name: '古参+新井',
    eligibleCourseIds: [
      '9d7f6a00-bf82-4eb8-af00-abba70fde6f2', // 柴田_インスタ
      '98179ed1-9c93-4fa1-95b9-e760fcf39b16', // たいよう_Ai動画
      '164b946c-3c48-4dc4-b222-304e45498e25', // 林_AIライティング
      '0996813b-2ff0-4522-9210-ee2f1b09b6ab', // 新井_AI副業
    ],
    slackChannelId: 'C0123456789',
  },
  {
    id: GRP_SHINKI_TAKEUCHI,
    name: '新規+竹内',
    eligibleCourseIds: [
      'c3',                                     // 渡邊_AI動画
      'cb20afea-ea7a-43ef-84ce-ffafa28f8bc8',   // 遠藤_在宅副業
      'f6347f8d-a3b2-4211-83b8-73b95cceeb9c',   // 瀧上_業務改善
      'e252c024-2b17-4321-ab5c-36d3c29b5f3a',   // 竹内_占い
      '9ddbcf84-84b5-4a88-938c-679cb79a3ff8',   // 竹内_コンサル
    ],
    slackChannelId: 'C0123456789',
  },
  {
    id: GRP_NN,
    name: 'nn',
    eligibleCourseIds: [],
    slackChannelId: 'C0123456789',
  },
  {
    id: GRP_TAKEUCHI,
    name: '竹内',
    eligibleCourseIds: [
      'e252c024-2b17-4321-ab5c-36d3c29b5f3a', // 竹内_占い
      '9ddbcf84-84b5-4a88-938c-679cb79a3ff8', // 竹内_コンサル
    ],
    slackChannelId: 'C0123456789',
  },
];

// --- Members (with group assignments and active status) ---
const MEMBER_GROUP_MAP: Record<string, string> = {
  // 古参+新井 (old: グループ林新井 + グループ古参)
  'member_001': GRP_KOSAN_ARAI,
  'member_002': GRP_KOSAN_ARAI,
  'member_016': GRP_KOSAN_ARAI,
  'member_017': GRP_KOSAN_ARAI,
  'member_018': GRP_KOSAN_ARAI,
  'member_019': GRP_KOSAN_ARAI,
  'member_020': GRP_KOSAN_ARAI,
  'member_021': GRP_KOSAN_ARAI,
  // 1000円講座 (old: グループりん)
  'member_003': GRP_1000EN,
  'member_004': GRP_1000EN,
  'member_005': GRP_1000EN,
  'member_006': GRP_1000EN,
  'member_007': GRP_1000EN,
  'member_008': GRP_1000EN,
  'member_009': GRP_1000EN,
  'member_010': GRP_1000EN,
  'member_011': GRP_1000EN,
  'member_012': GRP_1000EN,
  'member_013': GRP_1000EN,
  'member_014': GRP_1000EN,
  'member_015': GRP_1000EN,
  // 新規+竹内 (old: グループ新規 + グループ竹内)
  'member_022': GRP_SHINKI_TAKEUCHI,
  'member_023': GRP_SHINKI_TAKEUCHI,
  'member_024': GRP_SHINKI_TAKEUCHI,
  'member_025': GRP_SHINKI_TAKEUCHI,
  'member_026': GRP_SHINKI_TAKEUCHI,
  'member_027': GRP_SHINKI_TAKEUCHI,
  'member_028': GRP_SHINKI_TAKEUCHI,
  'member_029': GRP_SHINKI_TAKEUCHI,
  'member_031': GRP_SHINKI_TAKEUCHI,
  'member_032': GRP_SHINKI_TAKEUCHI,
};

const MEMBER_SLACK_MAP: Record<string, string> = {
  'member_001': 'U09D156EG1J',
  'member_002': 'U09QQG981ND',
  'member_003': 'U09M21HREBV',
  'member_004': 'U094NEY3BU6',
  'member_005': 'U0A8UTEGWFR',
  'member_006': 'U08JA497FTR',
  'member_007': 'U097M77D6MU',
  'member_008': 'U08SZKSMGFN',
  'member_009': 'U07JVD6U3TK',
  'member_010': 'U07TY5RGUF5',
  'member_011': 'U091S244UKF',
  'member_012': 'U0934RDM6TH',
  'member_013': 'U09D1LUQHLP',
  'member_014': 'U09K5RNHTL1',
  'member_015': 'U09F1MDLV7Z',
  'member_016': 'U09LGJB97KM',
  'member_017': 'U09MC5TNYJG',
  'member_018': 'U09KY4X14DR',
  'member_019': 'U07J547LTF0',
  'member_020': 'U07LMFEUU5V',
  'member_021': 'U07D58CB2D8',
  'member_022': 'U09M52R2B1D',
  'member_023': 'U09M5J0QX52',
  'member_024': 'U092Y5YNPMX',
  'member_025': 'U09NPG1UFFU',
  'member_026': 'U09H9DY8ATW',
  'member_027': 'U09QNUV0RRA',
  'member_028': 'U09V4GZSG9F',
  'member_029': 'U0AAUD5ATQS',
  'member_031': 'U09V3S9A3AB',
  'member_032': 'U0A7NDVR2JC',
};

const MEMBER_NAMES = [
  '井出 美都子', '杉浦 ゆかり', '大木 雄太', '田口 昇', '土方 康司',
  '東海 林由架', '平田 良子', '中村 一彦', '小川 芳華', '野城 紗唯奈',
  '高橋 聖和', '野尻 幸樹実', '国枝 伶奈', '笹原 あゆみ', '小柳 隆夫',
  '荻野 賀子', '河野 茜', '井口 聡', '面田 夏美', '渡辺 琉',
  '小幡 愛実', '佐野 景子', '國貞 美佐子', '泉 博美', '杉本奈津枝',
  '小谷 千津', '越川 幸江', '和田 恵太', '渡邊 佳紀', '坂本 徳子',
  '山崎 史宣', '桑代 智章', '宗圓明子', '野村 幸子', '竹内 海斗',
  '堺 美子', '鬼本 滉平', '柴田 太陽', '野口 剛司', '関根 祐子',
  '中川里織',
];

export const DEFAULT_MEMBERS: Member[] = MEMBER_NAMES.map((name, i) => {
  const id = `member_${String(i + 1).padStart(3, '0')}`;
  return {
    id,
    name,
    groupId: MEMBER_GROUP_MAP[id] ?? '',
    slackUserId: MEMBER_SLACK_MAP[id] ?? '',
    isActive: id in MEMBER_GROUP_MAP,
  };
});
