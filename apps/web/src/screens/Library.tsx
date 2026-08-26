import { m } from "motion/react";
import { useMemo, useState } from "react";
import { artPath, livingItems, type ContentPack, type ImageChoiceItem } from "@curio/core";
import { PACKS } from "@curio/content";

import { cascade, Plate, rise, Scene } from "../design/index.js";

interface LibraryProps {
  onBack(): void;
  /** Previews a pack's world while you browse its images. */
  onPreview(packId: string): void;
}

/**
 * Every picture the game has.
 *
 * Two jobs: it is how a picture round gets reviewed before anyone plays it —
 * generated art needs a human to look at it — and it makes plain which
 * subjects are still waiting to be generated, which is most of them until
 * someone runs `npm run art`.
 */
export function Library({ onBack, onPreview }: LibraryProps) {
  const packs = useMemo(
    () => PACKS.map((pack) => ({ pack, images: livingItems(pack, "imageChoice") })),
    [],
  );
  const [packId, setPackId] = useState(packs[0]?.pack.id ?? "");
  const current = packs.find((entry) => entry.pack.id === packId) ?? packs[0];

  const generated = current?.images.filter((item) => item.art).length ?? 0;
  const total = current?.images.length ?? 0;

  const choose = (id: string) => {
    setPackId(id);
    onPreview(id);
  };

  return (
    <Scene
      id="library"
      flow="top"
      rail={
        <>
          <button type="button" className="button button--quiet button--inline state" onClick={onBack}>
            ← Back
          </button>
          <span className="eyebrow">
            {generated} generated · {total - generated} drawn
          </span>
        </>
      }
      dock={
        <p className="tiny faint center">
          Subjects without a picture are generated with <code>npm run art</code>.
        </p>
      }
    >
      <div className="stack--tight">
        <h1>The picture gallery</h1>
        <p className="lede">Every image the game can ask you about.</p>
      </div>

      <div className="chips">
        {packs.map(({ pack, images }) => (
          <button
            key={pack.id}
            type="button"
            className="chip state"
            aria-pressed={pack.id === packId}
            onClick={() => choose(pack.id)}
          >
            <span className="chip__name">{pack.name}</span>
            <span className="chip__desc">{images.length} images</span>
          </button>
        ))}
      </div>

      {current?.pack.art ? (
        <div className="panel panel--quiet stack--tight">
          <span className="eyebrow">Art direction</span>
          <p className="small">{current.pack.art.style}</p>
          <p className="tiny faint">{current.pack.art.palette}</p>
        </div>
      ) : null}

      <m.div className="gallery" variants={cascade(0.05)} initial="hidden" animate="shown">
        {(current?.images ?? []).map((item, index) => (
          <GalleryItem key={`${item.art?.id ?? index}`} pack={current!.pack} item={item} />
        ))}
      </m.div>
    </Scene>
  );
}

/** One image, or the subject that will become one. */
function GalleryItem({ pack, item }: { pack: ContentPack; item: ImageChoiceItem }) {
  const [missing, setMissing] = useState(false);
  const answer = item.options[item.answer];

  return (
    <m.figure className="plate" variants={rise}>
      <Plate
        media={item.media}
        size="thumb"
        onMissing={() => setMissing(true)}
        fallback={
          missing ? (
            <div className="plate__pending">
              <span className="eyebrow">Not generated</span>
              <p className="tiny faint">{item.art?.subject}</p>
            </div>
          ) : undefined
        }
      />

      <figcaption className="plate__caption">
        <span className="plate__answer">{answer}</span>
        <span className="tiny faint">
          {item.art ? artPath(pack.id, item.art.id).replace(/^\//, "") : "drawn in the pack"}
        </span>
      </figcaption>
    </m.figure>
  );
}
