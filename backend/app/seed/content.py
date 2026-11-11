"""Hand-written course content: Spanish for English speakers.

Content is authored as vocabulary + sentences per skill; `generator.py` turns
each skill into lessons of varied exercises. Fill-in-the-blank items mark the
blank with [brackets] and list distractors that are wrong *given the English
hint*, so there's never more than one right answer.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Word:
    es: str
    en: str
    emoji: str


@dataclass(frozen=True)
class Sentence:
    es: str
    en: str
    alt_en: tuple[str, ...] = ()
    alt_es: tuple[str, ...] = ()


@dataclass(frozen=True)
class Blank:
    es: str  # "Yo [bebo] agua."
    en: str  # hint shown to the learner
    distractors: tuple[str, str]


@dataclass(frozen=True)
class SkillContent:
    title: str
    icon: str
    words: tuple[Word, ...]
    sentences: tuple[Sentence, ...]  # 6: two translations + one typing per lesson
    blanks: tuple[Blank, ...]  # 3: one per lesson


@dataclass(frozen=True)
class UnitContent:
    title: str
    description: str
    color: str
    skills: tuple[SkillContent, ...] = field(default_factory=tuple)


S, W, B = Sentence, Word, Blank

COURSE = dict(
    code="es-en",
    title="Spanish",
    learning_language="es",
    learning_language_name="Spanish",
    from_language="en",
)

UNITS: tuple[UnitContent, ...] = (
    UnitContent(
        title="Order in a café",
        description="Greet people, order drinks, introduce yourself",
        color="green",
        skills=(
            SkillContent(
                title="Greetings",
                icon="wave",
                words=(
                    W("hola", "hello", "👋"),
                    W("adiós", "goodbye", "🙋"),
                    W("gracias", "thank you", "🙏"),
                    W("por favor", "please", "🥺"),
                    W("buenos días", "good morning", "🌅"),
                    W("buenas noches", "good night", "🌙"),
                ),
                sentences=(
                    S("Hola, buenos días.", "Hello, good morning.", ("Hi, good morning.",)),
                    S("Adiós y buenas noches.", "Goodbye and good night.", ("Bye and good night.",)),
                    S("Gracias, adiós.", "Thank you, goodbye.",
                      ("Thanks, goodbye.", "Thanks, bye.", "Thank you, bye.")),
                    S("Agua, por favor.", "Water, please."),
                    S("Hola, ¿cómo estás?", "Hello, how are you?", ("Hi, how are you?",)),
                    S("Muy bien, gracias.", "Very well, thank you.",
                      ("Very well, thanks.", "Very good, thanks.", "Very good, thank you.")),
                ),
                blanks=(
                    B("[Hola], ¿cómo estás?", "Hello, how are you?", ("Gracias", "Noches")),
                    B("Muy bien, [gracias].", "Very well, thank you.", ("hola", "días")),
                    B("Buenas [noches].", "Good night.", ("días", "gracias")),
                ),
            ),
            SkillContent(
                title="At the café",
                icon="coffee",
                words=(
                    W("el café", "the coffee", "☕"),
                    W("el agua", "the water", "💧"),
                    W("el té", "the tea", "🍵"),
                    W("la leche", "the milk", "🥛"),
                    W("el pan", "the bread", "🍞"),
                    W("el jugo", "the juice", "🧃"),
                ),
                sentences=(
                    S("Quiero un café.", "I want a coffee.",
                      ("I want coffee.", "I would like a coffee."), ("Yo quiero un café.",)),
                    S("El té con leche.", "The tea with milk.", ("Tea with milk.",)),
                    S("Yo bebo agua.", "I drink water.",
                      ("I am drinking water.", "I'm drinking water."), ("Bebo agua.",)),
                    S("El pan y el jugo.", "The bread and the juice.", ("Bread and juice.",)),
                    S("Un café con leche, por favor.", "A coffee with milk, please."),
                    S("Ella bebe té.", "She drinks tea.", ("She is drinking tea.", "She's drinking tea.")),
                ),
                blanks=(
                    B("Yo [bebo] agua.", "I drink water.", ("bebe", "pan")),
                    B("Quiero [un] café.", "I want a coffee.", ("una", "y")),
                    B("El té con [leche].", "The tea with milk.", ("pan", "hola")),
                ),
            ),
            SkillContent(
                title="People",
                icon="people",
                words=(
                    W("el hombre", "the man", "👨"),
                    W("la mujer", "the woman", "👩"),
                    W("el niño", "the boy", "👦"),
                    W("la niña", "the girl", "👧"),
                    W("el amigo", "the friend", "🤝"),
                    W("la familia", "the family", "👪"),
                ),
                sentences=(
                    S("Soy un hombre.", "I am a man.", ("I'm a man.",), ("Yo soy un hombre.",)),
                    S("Ella es una mujer.", "She is a woman.", ("She's a woman.",)),
                    S("El niño y la niña.", "The boy and the girl."),
                    S("Él es mi amigo.", "He is my friend.", ("He's my friend.",)),
                    S("Yo soy Ana.", "I am Ana.", ("I'm Ana.",), ("Soy Ana.",)),
                    S("Mi familia es grande.", "My family is big.", ("My family is large.",)),
                ),
                blanks=(
                    B("Ella [es] una mujer.", "She is a woman.", ("soy", "son")),
                    B("El niño y [la] niña.", "The boy and the girl.", ("el", "un")),
                    B("Él es mi [amigo].", "He is my friend.", ("niña", "mujer")),
                ),
            ),
        ),
    ),
    UnitContent(
        title="Food and animals",
        description="Talk about what you eat, your pets and colors",
        color="purple",
        skills=(
            SkillContent(
                title="Food",
                icon="apple",
                words=(
                    W("la manzana", "the apple", "🍎"),
                    W("el queso", "the cheese", "🧀"),
                    W("la naranja", "the orange", "🍊"),
                    W("el huevo", "the egg", "🥚"),
                    W("la sopa", "the soup", "🍲"),
                    W("el arroz", "the rice", "🍚"),
                ),
                sentences=(
                    S("Yo como una manzana.", "I eat an apple.",
                      ("I am eating an apple.", "I'm eating an apple."), ("Como una manzana.",)),
                    S("El queso es bueno.", "The cheese is good.", ("Cheese is good.",)),
                    S("Ella come arroz.", "She eats rice.", ("She is eating rice.", "She's eating rice.")),
                    S("La sopa está caliente.", "The soup is hot."),
                    S("Nosotros comemos huevos.", "We eat eggs.",
                      ("We are eating eggs.", "We're eating eggs."), ("Comemos huevos.",)),
                    S("Una naranja, por favor.", "An orange, please."),
                ),
                blanks=(
                    B("Yo [como] una manzana.", "I eat an apple.", ("come", "comemos")),
                    B("Ella come [arroz].", "She eats rice.", ("leche", "agua")),
                    B("La sopa [está] caliente.", "The soup is hot.", ("soy", "estoy")),
                ),
            ),
            SkillContent(
                title="Animals",
                icon="paw",
                words=(
                    W("el perro", "the dog", "🐶"),
                    W("el gato", "the cat", "🐱"),
                    W("el pájaro", "the bird", "🐦"),
                    W("el caballo", "the horse", "🐴"),
                    W("el pez", "the fish", "🐟"),
                    W("la vaca", "the cow", "🐮"),
                ),
                sentences=(
                    S("El gato bebe leche.", "The cat drinks milk.", ("The cat is drinking milk.",)),
                    S("Tengo un perro.", "I have a dog.", (), ("Yo tengo un perro.",)),
                    S("El pájaro es pequeño.", "The bird is small.", ("The bird is little.",)),
                    S("El caballo es grande.", "The horse is big.", ("The horse is large.",)),
                    S("Ella tiene un gato.", "She has a cat."),
                    S("La vaca come.", "The cow eats.", ("The cow is eating.",)),
                ),
                blanks=(
                    B("Tengo un [perro].", "I have a dog.", ("vaca", "manzana")),
                    B("Ella [tiene] un gato.", "She has a cat.", ("tengo", "tienes")),
                    B("El pájaro es [pequeño].", "The bird is small.", ("grande", "caliente")),
                ),
            ),
            SkillContent(
                title="Colors",
                icon="palette",
                words=(
                    W("rojo", "red", "🔴"),
                    W("azul", "blue", "🔵"),
                    W("verde", "green", "🟢"),
                    W("amarillo", "yellow", "🟡"),
                    W("negro", "black", "⚫"),
                    W("blanco", "white", "⚪"),
                ),
                sentences=(
                    S("El perro es negro.", "The dog is black."),
                    S("La manzana es roja.", "The apple is red."),
                    S("Mi gato es blanco.", "My cat is white."),
                    S("El cielo es azul.", "The sky is blue."),
                    S("Me gusta el verde.", "I like green.", ("I like the green.",)),
                    S("El queso es amarillo.", "The cheese is yellow."),
                ),
                blanks=(
                    B("El cielo es [azul].", "The sky is blue.", ("rojo", "negro")),
                    B("La manzana es [roja].", "The apple is red.", ("rojo", "verde")),
                    B("Mi gato es [blanco].", "My cat is white.", ("blanca", "azul")),
                ),
            ),
        ),
    ),
    UnitContent(
        title="Get around town",
        description="Find places, take transport and count",
        color="blue",
        skills=(
            SkillContent(
                title="Places",
                icon="building",
                words=(
                    W("el hotel", "the hotel", "🏨"),
                    W("la playa", "the beach", "🏖️"),
                    W("el museo", "the museum", "🏛️"),
                    W("la calle", "the street", "🛣️"),
                    W("el parque", "the park", "🌳"),
                    W("la ciudad", "the city", "🏙️"),
                ),
                sentences=(
                    S("¿Dónde está el hotel?", "Where is the hotel?"),
                    S("La playa es bonita.", "The beach is pretty.", ("The beach is beautiful.",)),
                    S("El museo está cerca.", "The museum is near.",
                      ("The museum is close.", "The museum is nearby.")),
                    S("Vamos al parque.", "We go to the park.",
                      ("Let's go to the park.", "We are going to the park.")),
                    S("Me gusta la ciudad.", "I like the city."),
                    S("La calle es larga.", "The street is long."),
                ),
                blanks=(
                    B("¿Dónde [está] el hotel?", "Where is the hotel?", ("es", "soy")),
                    B("La playa es [bonita].", "The beach is pretty.", ("bonito", "larga")),
                    B("Vamos al [parque].", "We go to the park.", ("playa", "calle")),
                ),
            ),
            SkillContent(
                title="Transport",
                icon="train",
                words=(
                    W("el tren", "the train", "🚆"),
                    W("el avión", "the plane", "✈️"),
                    W("el autobús", "the bus", "🚌"),
                    W("el coche", "the car", "🚗"),
                    W("la bicicleta", "the bicycle", "🚲"),
                    W("el barco", "the boat", "⛵"),
                ),
                sentences=(
                    S("El tren es rápido.", "The train is fast.", ("The train is quick.",)),
                    S("Tomo el autobús.", "I take the bus.", (), ("Yo tomo el autobús.",)),
                    S("El avión llega hoy.", "The plane arrives today.", ("The airplane arrives today.",)),
                    S("Mi coche es rojo.", "My car is red."),
                    S("Ella va en bicicleta.", "She goes by bicycle.",
                      ("She goes by bike.", "She rides a bicycle.", "She rides a bike.")),
                    S("El barco es grande.", "The boat is big.", ("The ship is big.", "The boat is large.")),
                ),
                blanks=(
                    B("El tren es [rápido].", "The train is fast.", ("rápida", "grande")),
                    B("[Tomo] el autobús.", "I take the bus.", ("Toma", "Tomas")),
                    B("Ella va en [bicicleta].", "She goes by bicycle.", ("avión", "tren")),
                ),
            ),
            SkillContent(
                title="Numbers",
                icon="numbers",
                words=(
                    W("uno", "one", "1️⃣"),
                    W("dos", "two", "2️⃣"),
                    W("tres", "three", "3️⃣"),
                    W("cuatro", "four", "4️⃣"),
                    W("cinco", "five", "5️⃣"),
                    W("diez", "ten", "🔟"),
                ),
                sentences=(
                    S("Tengo dos gatos.", "I have two cats.", (), ("Yo tengo dos gatos.",)),
                    S("Tres cafés, por favor.", "Three coffees, please."),
                    S("Ella tiene cinco libros.", "She has five books."),
                    S("Somos cuatro amigos.", "We are four friends.", ("We're four friends.",)),
                    S("Un perro y un gato.", "A dog and a cat.", ("One dog and one cat.",)),
                    S("Hay diez niños.", "There are ten children.",
                      ("There are ten kids.", "There are ten boys.")),
                ),
                blanks=(
                    B("Tengo [dos] gatos.", "I have two cats.", ("uno", "tres")),
                    B("Ella tiene [cinco] libros.", "She has five books.", ("cuatro", "diez")),
                    B("Hay [diez] niños.", "There are ten children.", ("dos", "uno")),
                ),
            ),
        ),
    ),
)

ACHIEVEMENTS = (
    # (metric, title, icon, color, description template, thresholds)
    ("streak", "On Fire", "flame", "orange", "Reach a {n} day streak", (3, 7, 14, 30)),
    ("total_xp", "XP Hunter", "bolt", "yellow", "Earn {n} XP", (100, 250, 500, 1000, 2000)),
    ("lessons", "Bookworm", "book", "blue", "Complete {n} lessons", (5, 10, 25, 50)),
    ("perfect_lessons", "Sharpshooter", "target", "red", "Finish {n} lessons with no mistakes", (1, 5, 10, 25)),
    ("skills", "Trailblazer", "crown", "purple", "Complete {n} skills", (1, 3, 6, 9)),
)

BOTS = (
    ("mia", "Mia", "pink"), ("lucas", "Lucas", "blue"), ("sofia", "Sofía", "purple"),
    ("kenji", "Kenji", "orange"), ("priya", "Priya", "green"), ("omar", "Omar", "red"),
    ("elena", "Elena", "teal"), ("noah", "Noah", "yellow"), ("aisha", "Aisha", "pink"),
    ("mateo", "Mateo", "blue"), ("chloe", "Chloe", "purple"), ("ravi", "Ravi", "orange"),
    ("hana", "Hana", "teal"), ("leo", "Leo", "green"),
)


# Word-level meanings for the hover hints on Spanish prompts. Vocabulary from
# the skills above is added automatically (see generator.hint_glossary); this
# covers the remaining function words, verbs and inflections the sentences use.
GLOSSARY = {
    "yo": "I", "tú": "you", "él": "he", "ella": "she", "nosotros": "we",
    "soy": "I am", "es": "is", "está": "is", "estás": "are (you)", "somos": "we are", "hay": "there is / are",
    "el": "the", "la": "the", "los": "the", "un": "a", "una": "a / an", "mi": "my", "al": "to the",
    "y": "and", "con": "with", "en": "in / by", "por": "for", "favor": "please (por favor)",
    "muy": "very", "bien": "well", "cómo": "how", "dónde": "where", "hoy": "today", "cerca": "near",
    "quiero": "I want", "bebo": "I drink", "bebe": "drinks", "como": "I eat", "come": "eats",
    "comemos": "we eat", "tengo": "I have", "tiene": "has", "vamos": "we go", "va": "goes",
    "tomo": "I take", "llega": "arrives", "gusta": "like(s)", "me": "me",
    "bueno": "good", "grande": "big", "pequeño": "small", "caliente": "hot", "bonita": "pretty",
    "larga": "long", "rápido": "fast", "roja": "red", "cielo": "sky",
    "buenos": "good", "buenas": "good", "días": "days (buenos días = good morning)",
    "noches": "nights (buenas noches = good night)",
    "huevos": "eggs", "libros": "books", "gatos": "cats", "cafés": "coffees", "amigos": "friends",
    "niños": "children", "ana": "Ana",
}
