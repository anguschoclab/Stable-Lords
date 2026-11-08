import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HELP_LINK =
  'text-[10px] font-black uppercase tracking-[0.15em] text-arena-gold/80 transition-colors hover:text-arena-gold motion-reduce:transition-none';

/** Route links from a rules topic to the workspace that applies it. */
function ContextLinks({ links }: { links: { to: string; label: string }[] }) {
  return (
    <nav aria-label="Related workspaces" className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
      {links.map((link) => (
        <Link key={link.to} to={link.to} className={HELP_LINK}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/** Codex section: strategy. */
export function StrategyBasicsSection() {
  return (
    <AccordionItem value="strategy">
      <AccordionTrigger className="font-display text-lg">Strategy Basics</AccordionTrigger>
      <AccordionContent className="space-y-3 text-sm">
        <div>
          <Badge variant="outline" className="mr-2">
            OE
          </Badge>
          <strong>Offensive Effort</strong> (1-10): How aggressively your warrior attacks. Higher OE
          means more damage potential but drains endurance faster. Also reduces your own defensive
          skills.
        </div>
        <div>
          <Badge variant="outline" className="mr-2">
            AL
          </Badge>
          <strong>Activity Level</strong> (1-10): Movement and tempo. High AL improves initiative
          but costs stamina. Low AL conserves energy for the late bout.
        </div>
        <div>
          <Badge variant="outline" className="mr-2">
            KD
          </Badge>
          <strong>Kill Desire</strong> (1-10): How ruthlessly your warrior fights when an opponent
          is wounded. High KD increases kill chance but may leave openings. Only triggers when the
          enemy is low on HP and endurance.
        </div>
        <div>
          <Badge variant="outline" className="mr-2">
            Target
          </Badge>
          <strong>Body Target</strong>: Choose Head, Chest, Abdomen, Arms, Legs, or Any. Head hits
          deal 50% more damage, chest 20%, while limb hits deal less but are easier to land.
        </div>
        <div>
          <strong>Offensive Tactics</strong>: Lunge, Slash, Bash, or Decisiveness. Matching your
          style (e.g., Bash for Bashers) avoids anti-synergy penalties. Mismatched tactics reduce
          effectiveness.
        </div>
        <div>
          <strong>Defensive Tactics</strong>: Dodge, Parry, Riposte, or Responsiveness. Riposte
          works best for parry styles; Total Parry excels with the Parry tactic.
        </div>
        <ContextLinks
          links={[
            { to: '/stable/planner', label: 'Configure battle plans' },
            { to: '/stable/training', label: 'Review training' },
          ]}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: styles. */
export function FightingStylesSection() {
  return (
    <AccordionItem value="styles">
      <AccordionTrigger className="font-display text-lg">Fighting Styles</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Each warrior has one of 10 fighting styles that determines their combat approach and stat
          bonuses:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Basher (BA)</strong> — Raw power, high ATT and INI seeds. Excels with heavy
            weapons and high OE. Weak against defensive styles.
          </li>
          <li>
            <strong>Lunger (LU)</strong> — Fastest initiative, burst offense with thrusting weapons.
            Great in the opening but tires quickly.
          </li>
          <li>
            <strong>Striker (ST)</strong> — The pure offensive: wins on the first blow or not at
            all. Lives on decisiveness and initiative, hunts other offensives and out-endures
            scum. Walls and rippers that weather the opener are its nightmare.
          </li>
          <li>
            <strong>Slasher (SL)</strong> — Speed-dependent blade work. High ATT and INI, weak
            parry. Needs SP and DF.
          </li>
          <li>
            <strong>Aimed-Blow (AB)</strong> — Precision targeting, high DEC for kill windows. Light
            weapons only. Needs WT and DF.
          </li>
          <li>
            <strong>Parry-Lunger (PL)</strong> — Balanced offense/defense. Waits for openings then
            counters with lunges. The jack-of-all-trades.
          </li>
          <li>
            <strong>Parry-Riposte (PR)</strong> — Counter-fighting specialist. Highest RIP seed.
            Lets opponents attack then punishes mistakes.
          </li>
          <li>
            <strong>Parry-Striker (PS)</strong> — The hardest style to win with and the most
            flexible. Fights above its skill sheet, conserves endurance, pivots between offense
            and defense. Needs WT and DF.
          </li>
          <li>
            <strong>Total-Parry (TP)</strong> — Ultimate defense. Highest PAR and DEF seeds. Wins by
            exhausting opponents. Low damage output.
          </li>
          <li>
            <strong>Wall of Steel (WS)</strong> — "the Waste." Hybrid all-rounder that learns
            initiative, parry, and attack readily but burns endurance like a lunger — will is the
            keystone. Canon walls open hot, then taper activity to the high-low pace.
          </li>
        </ul>
        <p className="mt-3">
          <strong>Style Matchups</strong>: Each style has advantages and disadvantages against
          others. Offensive styles beat other offensives but struggle against defensive styles.
          Total Parry and Wall of Steel counter most attackers but lose to each other.
        </p>
        <ContextLinks links={[{ to: '/world/style-archives', label: 'Open style archives' }]} />
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: fighter concepts. */
export function FighterConceptsSection() {
  return (
    <AccordionItem value="concepts">
      <AccordionTrigger className="font-display text-lg">Fighter Concepts</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          The Arena 93 archives record canonical long-term builds for every style — proven stat
          spreads paired with the tactics that suit them. They are concepts, not requirements:
          there is no perfect warrior, and challenges plus scouting matter more than the exact
          numbers.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Concept builds</strong> — Each style has named builds (e.g., the
            Total-Parry "Ghost", the Basher "Workhorse", a dozen canonical rippers,
            nine canonical slashers, eleven canonical parry-lungers, fifteen
            canonical lungers) tuned for
            long-term growth.
          </li>
          <li>
            <strong>Presets</strong> — Apply a concept directly in the Warrior Builder's Fighter
            Concept picker; the spread fills your 70-point budget automatically.
          </li>
          <li>
            <strong>Tactics</strong> — Every concept ships with its suited offensive and defensive
            tactics and a suggested fight rhythm.
          </li>
        </ul>
        <ContextLinks
          links={[
            { to: '/world/style-archives', label: 'Browse the concepts' },
            { to: '/stable/recruit', label: 'Forge a warrior' },
          ]}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: warrior design. */
export function WarriorDesignSection() {
  return (
    <AccordionItem value="design">
      <AccordionTrigger className="font-display text-lg">Designing a Warrior</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          The Arena 93 archives record five design axes every manager weighs at
          once — there is no perfect warrior, but these rules keep the other
          99% alive:
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Fighting style</strong> — Offensive styles (LU, SL, ST, AB, BA) key on
            will and strength; defensive styles (TP, PR, PS) key on will and
            constitution; mixed styles (WS, PL) key on will plus balanced
            skill cut-offs.
          </li>
          <li>
            <strong>Physical capabilities</strong> — Endurance, damage, and the ability
            to take a hit. At least one should reach the "good" level or above;
            the more the better. Trading strength for deftness usually buys
            more damage than the lost skills are worth.
          </li>
          <li>
            <strong>Weapon suitability</strong> — Be well-suited to several weapons of
            your style, and no more than a couple stat trains away from more.
            It lets you change up and surprise your foes.
          </li>
          <li>
            <strong>Trainability</strong> — Leave a stat a couple points below a skill
            breakpoint (deftness at 9 is the classic) and train it once your
            skills are learned. Trains past 21 yield quick, significant skills.
          </li>
          <li>
            <strong>Longevity</strong> — Decide the career length at birth. High wit
            learns fastest; high will finds easy trains. Canon tips: never
            design an aimed-blow without top-tier deftness, and keep wit low
            on scum warriors.
          </li>
        </ul>
        <ContextLinks
          links={[
            { to: '/stable/recruit', label: 'Try the Design Review' },
            { to: '/world/style-archives', label: 'Style families in the archives' },
          ]}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: attributes. */
export function AttributesSection() {
  return (
    <AccordionItem value="attributes">
      <AccordionTrigger className="font-display text-lg">Attributes & Skills</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>7 attributes, total = 70 points, range 3–25 each:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>ST (Strength)</strong> — Damage output and carry capacity. Primary for Bashers.
          </li>
          <li>
            <strong>CN (Constitution)</strong> — Hit points and endurance base. Essential for
            longevity.
          </li>
          <li>
            <strong>SZ (Size)</strong> — Weight class. Adds to HP and damage but reduces carry
            efficiency.
          </li>
          <li>
            <strong>WT (Wit)</strong> — Primary skill driver. Affects ATT, PAR, INI, RIP, and DEC.
            The most important attribute.
          </li>
          <li>
            <strong>WL (Will)</strong> — Endurance capacity and determination. Helps PAR and DEC.
            Second most important.
          </li>
          <li>
            <strong>SP (Speed)</strong> — Initiative and defense. Critical for Lungers and Slashers.
          </li>
          <li>
            <strong>DF (Deftness)</strong> — Accuracy and riposte capability. Key for Aimed-Blow and
            Parry-Riposte.
          </li>
        </ul>
        <p className="mt-3">
          <strong>Breakpoint Bonuses</strong>: Stats at 9, 13, 17, and 21 provide increasing skill
          bonuses (+1, +2, +3, +4). Plan your warrior's stats around these breakpoints.
        </p>
        <p className="mt-2">
          <strong>Derived Stats</strong>:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>HP</strong> = f(CN, SZ, WL) — How much damage before going down
          </li>
          <li>
            <strong>Endurance</strong> = f(CN, WL, ST) — How long before exhaustion
          </li>
          <li>
            <strong>Damage</strong> = f(ST, SZ) — Little → Normal → Good → Great → Tremendous
          </li>
          <li>
            <strong>Carry Cap</strong> = f(ST, CN, SZ) — Max equipment weight before penalties
          </li>
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: equipment. */
export function EquipmentSection() {
  return (
    <AccordionItem value="equipment">
      <AccordionTrigger className="font-display text-lg">Equipment & Encumbrance</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>Equipment affects combat stats and must fit within your warrior's carry capacity:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Weapons</strong>: Light weapons (wt 1-2) grant +1 INI. Heavy weapons (wt 5+)
            grant +1 damage. Two-handed weapons block shield use.
          </li>
          <li>
            <strong>Shields</strong>: Buckler (+1 PAR), Small (+1 PAR/DEF), Medium (+2 DEF), Large
            (+3 DEF, -1 ATT). Restricted for some styles.
          </li>
          <li>
            <strong>Armor</strong>: Heavier armor protects but costs endurance. Chain mail and above
            drain stamina faster.
          </li>
          <li>
            <strong>Helms</strong>: Full Helm gives great head protection but -1 INI. Aimed-Blow
            warriors can't use it.
          </li>
        </ul>
        <p className="mt-2">
          <strong>Over-Encumbered</strong>: Exceeding carry capacity penalizes INI, DEF, and
          endurance. Keep total weight at or below your Carry Cap.
        </p>
        <p className="mt-2">
          <strong>Style Restrictions</strong>: Some items are restricted by style (e.g., Aimed-Blow
          can't use heavy weapons or full helms, Lungers can't use medium/large shields).
        </p>
        <p className="mt-2">
          <strong>Preferred Weapons</strong>: Weapons marked with ⭐ are thematically suited to your
          style. Use them for optimal performance.
        </p>
        <ContextLinks links={[{ to: '/stable/equipment', label: 'Review stable equipment' }]} />
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: trainers. */
export function TrainersSection() {
  return (
    <AccordionItem value="trainers">
      <AccordionTrigger className="font-display text-lg">Trainers</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>Hire up to 5 trainers to boost your stable's capabilities:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Aggression</strong> ⚔️ — Boosts ATT skill in combat
          </li>
          <li>
            <strong>Defense</strong> 🛡️ — Boosts PAR and DEF skills
          </li>
          <li>
            <strong>Endurance</strong> 💪 — Increases stamina pool
          </li>
          <li>
            <strong>Mind</strong> 🧠 — Boosts INI and DEC for better initiative and kill windows
          </li>
          <li>
            <strong>Healing</strong> 💊 — Reduces the chance of your warriors being killed in combat
          </li>
        </ul>
        <p className="mt-2">
          <strong>Tiers</strong>: Novice (+1), Seasoned (+2), Master (+3) — higher tiers give
          stronger bonuses.
        </p>
        <p className="mt-2">
          <strong>Retired Warriors</strong>: Retired warriors can be converted into trainers. Their
          tier is based on career wins, and they provide a style-specific bonus for warriors of
          their same style.
        </p>
        <p className="mt-2">
          <strong>Contracts</strong>: Trainers serve 52-week contracts. When expired, they leave
          automatically.
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: combat. */
export function CombatResolutionSection() {
  return (
    <AccordionItem value="combat">
      <AccordionTrigger className="font-display text-lg">Combat Resolution</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>Each exchange follows the canonical resolution chain:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <strong>Initiative (INI)</strong> — Determines who attacks first. Modified by AL and
            style matchup.
          </li>
          <li>
            <strong>Attack (ATT)</strong> — Roll to hit. Modified by OE and matchup bonus.
          </li>
          <li>
            <strong>Parry (PAR)</strong> — Defender tries to block. If successful, may riposte.
          </li>
          <li>
            <strong>Defense (DEF)</strong> — If parry fails, dodge check. Modified by OE penalty.
          </li>
          <li>
            <strong>Riposte (RIP)</strong> — Counter-attack after successful parry or attacker
            whiff.
          </li>
          <li>
            <strong>Damage</strong> — Hit location × damage class × variance. Head hits deal 50%
            extra.
          </li>
          <li>
            <strong>Decisiveness (DEC)</strong> — When target is low HP+endurance, opens kill
            window.
          </li>
          <li>
            <strong>Endurance</strong> — Both fighters drain stamina each exchange. Higher OE/AL =
            faster drain.
          </li>
        </ol>
        <p className="mt-2">
          <strong>Victory Conditions</strong>: Kill, KO (HP ≤ 0), Stoppage (endurance ≤ 0),
          Exhaustion (both exhausted), or Decision (time/points).
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: learning. */
export function LearningSection() {
  return (
    <AccordionItem value="learning">
      <AccordionTrigger className="font-display text-lg">
        Lessons & Favorite Learns
      </AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Warriors learn in the arena itself — after every bout a warrior banks
          <strong> lessons</strong>, permanent +1 skill bonuses on top of their
          trained sheet. Wit gates the roll: WT 15 ≈ 3–4 lessons per fight.
        </p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Six skills</strong> — ATT, PAR, DEF, INI, RIP, DEC. What a
            warrior tends to learn follows their style's teach order and the
            opponent's: fight a riposte specialist and their RIP lessons rub
            off. Caps: 6 per skill, 24 career.
          </li>
          <li>
            <strong>Favorite learn</strong> — Every warrior has one hidden
            skill they absorb fastest. Watch the <em>Lessons Banked</em>{' '}
            ledger: a skill at 3+ is flagged Suspected until a{' '}
            <strong>Learn insight</strong> confirms it.
          </li>
          <li>
            <strong>Weapon charting</strong> — The dossier tallies swings,
            crits, and extra-value hits per weapon. A weapon producing nothing
            after a couple dozen swings is evidence to change hands.
          </li>
          <li>
            <strong>Manager's Notebook</strong> — A losing warrior's dossier
            shows the turnaround advisor's read: one win condition to build
            around plus the plan, weapon, and matchup moves that evidence
            supports.
          </li>
        </ul>
        <ContextLinks
          links={[{ to: '/stable/warriors', label: 'Open the dossier' }]}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: tokens. */
export function InsightTokensSection() {
  return (
    <AccordionItem value="tokens">
      <AccordionTrigger className="font-display text-lg">Insight Tokens</AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Earned from tournament victories (2nd and 3rd place), these rare relics allow you to
          unmask your opponents' secrets:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Weapon Token</strong> ⚔️ — Reveals the exact damage and weight of a target's
            equipped weapon.
          </li>
          <li>
            <strong>Rhythm Token</strong> 🥁 — Reveals a warrior's hidden combat tendencies (OE, AL,
            and KD).
          </li>
          <li>
            <strong>Style Token</strong> 🥋 — Instantly identifies a warrior's core fighting style
            without scouting.
          </li>
          <li>
            <strong>Learn Token</strong> 🧠 — Reveals your warrior's favorite learn — the skill
            their lessons bank fastest.
          </li>
        </ul>
        <p className="mt-2">
          Use these tokens in the <strong>Booking Office</strong> or <strong>Treasury</strong> to
          gain a decisive advantage before a major clash.
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

/** Codex section: progression. */
export function ProgressionSection() {
  return (
    <AccordionItem value="progression">
      <AccordionTrigger className="font-display text-lg">
        Stable Progression & Victory
      </AccordionTrigger>
      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Your stable progresses through a series of objectives culminating in the Realm Champion
          title — awarded to the #1 stable at year's end.
        </p>
        <p>Objectives are tracked automatically each week:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-foreground">Reach Top 10</strong> — Rank among the top 10
            stables by fame.
          </li>
          <li>
            <strong className="text-foreground">Reach Top 3</strong> — Rank among the top 3 stables
            by fame.
          </li>
          <li>
            <strong className="text-foreground">Tournament Victor</strong> — Win a tournament with
            one of your warriors.
          </li>
          <li>
            <strong className="text-foreground">Arena Champion</strong> — Hold an arena
            championship with one of your warriors.
          </li>
          <li>
            <strong className="text-foreground">Lord of the Circuit</strong> — Hold three arena
            championships across three different warriors.
          </li>
          <li>
            <strong className="text-foreground">Grand Champion</strong> — Win the annual
            champions-only Grand Championship.
          </li>
          <li>
            <strong className="text-foreground">Hall of Famer</strong> — Have a warrior win Warrior
            of the Year or Killer of the Year.
          </li>
          <li>
            <strong className="text-foreground">Realm Champion</strong> — Finish a year as the #1
            stable in the realm.
          </li>
        </ul>
        <p>
          Stable standing is determined by fame, with ties broken by titles won. When you achieve
          Realm Champion status, a victory screen appears. You may continue playing in legacy mode
          or start a new game.
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}
