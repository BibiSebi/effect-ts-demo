import { Effect, Console, pipe } from "effect";
import * as S from "@effect/schema/Schema";
import { flatMap } from "effect/Effect";

const getPokemon = (id: number) =>
  pipe(
    Effect.tryPromise({
      try: () =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`).then((res) =>
          res.json(),
        ),
      catch: (e) => new Error(`Error when fetching pokemon: ${e}`),
    }),
    flatMap((res) => parsePokemon(res)),
  );

const pokemonSchema = S.struct({
  name: S.string,
  weight: S.number,
});

type Pokemon = S.Schema.To<typeof pokemonSchema>;

const parsePokemon = S.parse(pokemonSchema);

const getRandomNumberArray = Effect.all(
  Array.from({ length: 10 }, () =>
    Effect.sync(() => Math.floor(Math.random() * 100) + 1),
  ),
);

const getHeaviestPokemon = (pokemons: Pokemon[]) =>
  Effect.reduce(pokemons, 0, (acc, currentPokemon) =>
    currentPokemon.weight === acc
      ? Effect.fail(
          new Error("There are multiple pokemons with the same wieght"),
        )
      : Effect.succeed(
          acc < currentPokemon.weight ? currentPokemon.weight : acc,
        ),
  );

const program = pipe(
  getRandomNumberArray,
  flatMap((arr) => Effect.all(arr.map(getPokemon))),
  Effect.tap((pokemons) =>
    console.log(
      pokemons.map(
        (pokemon) => `Name: ${pokemon.name}, weight: ${pokemon.weight}`,
      ),
    ),
  ),
  flatMap((pokemons) => getHeaviestPokemon(pokemons)),
  Effect.tap((heaviest) => Effect.log(`Heaviest Pokemon weights ${heaviest}`)),
);

Effect.runPromise(program);
