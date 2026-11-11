/**
 * Help Center content. Written for this app (its rules and numbers match the
 * backend config), organised like the original's FAQ: categories of questions.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  title: string;
  items: FaqItem[];
}

export const FAQ: FaqCategory[] = [
  {
    title: "Using lingo",
    items: [
      {
        q: "What is a streak?",
        a: "Your streak counts the days in a row you've completed at least one lesson. Your first lesson each day extends it; miss a whole day and it resets to 0. The flame in the top bar turns orange once you've extended it today.",
      },
      {
        q: "What are leaderboards and leagues?",
        a: "Leagues are weekly leaderboards. Everyone in your league is ranked by the XP they earn from Monday to Sunday, and the top 7 are in the promotion zone. Leagues unlock after you complete 10 lessons.",
      },
      {
        q: "How do hearts work?",
        a: "You start with 5 hearts and lose one for each mistake in a lesson (practice and match-pair taps never cost hearts). Hearts come back over time, one per hour. You can also refill them with gems in the Shop, or earn one back with a practice session. The first time you run out, the refill is on us.",
      },
      {
        q: "What are gems and chests?",
        a: "Gems are the in-app currency, used for things like refilling hearts. You earn them by opening the treasure chest in each unit (after finishing the levels above it) and by reaching your daily XP goal.",
      },
      {
        q: "What do crowns mean on the learning path?",
        a: "When you finish every lesson in a skill you earn its first crown. Each time you review a completed skill you earn another, up to 5. Crowns show how well you've practised a skill.",
      },
      {
        q: "What is the daily goal?",
        a: "Your daily goal is how much XP you aim to earn each day: Casual (10), Regular (20), Serious (30) or Intense (50). Change it in Settings. Reaching it fills the Daily Quest bar and opens a gem chest.",
      },
    ],
  },
  {
    title: "Account & Settings",
    items: [
      {
        q: "How do I change my name?",
        a: "Go to More → Settings and edit your name in the Profile section. Your new name shows on your profile and in your league.",
      },
      {
        q: "How do I turn dark mode on or off?",
        a: "Go to More → Settings → Appearance and pick System default, On or Off. System default follows your device setting.",
      },
      {
        q: "Can I turn off sounds, animations or encouragement messages?",
        a: "Yes. Settings → Lesson experience has switches for sound effects, animations, motivational messages and reading prompts aloud. They're saved to your account.",
      },
      {
        q: "Is my progress saved?",
        a: "Yes. Your XP, streak, hearts, gems, completed skills and achievements are all saved on the server, so they're there next time you open the app.",
      },
    ],
  },
  {
    title: "Subscription & Payments",
    items: [
      {
        q: "What is Super?",
        a: "Super is a subscription with unlimited hearts and no ads. It isn't available in this version of lingo yet.",
      },
      {
        q: "Can I buy gems?",
        a: "Not yet. For now, gems are earned by opening chests and reaching your daily goal.",
      },
    ],
  },
];
