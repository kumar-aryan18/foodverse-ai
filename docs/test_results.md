# Test results

## Food recognition (20 classes)
- Food-101 test split: 90.6% (5,000 images, never used for training)

## Freshness (fresh vs rotten)
Own-photo test set: 27 photos (14 fresh, 13 rotten), never used in training.

| Model | Overall | Fresh correct | Rotten correct |
|---|---|---|---|
| v1: 6 classes, Kaggle only | 21/27 (77.8%) | 10/14 | 11/13 |
| v2: 2 classes, more varied data + own photos | 23/27 (85.2%) | 13/14 | 10/13 |

- v1 scored 99.8% on the Kaggle test split but only 77.8% on real photos
  (near-duplicate images between Kaggle train and test).
- v1 gave 1.00 confidence on wrong answers; v2 uses label smoothing.
- Raising the "fresh" threshold did not help (rotten accuracy stayed at 10/13
  until 0.9, while fresh accuracy fell to 6/14).
- A wide "not sure" band (0.3 to 0.7) set aside 4 photos, all correct, and
  caught none of the errors. The app uses a narrow band (0.35 to 0.65) as a
  cautious design choice; it is not a validated accuracy gain.
- Three rotten photos (rotten_01, rotten_03, rotten_13) are called fresh with
  0.83 to 0.93 probability. (Add what these photos have in common.)

## Known limitations
- Appearance only; cannot guarantee food safety. 3 of 13 rotten photos were
  called fresh, which is the costly error.
- Small test set (27 photos): true accuracy could be roughly 72% to 98%.
- Transparent PNGs are pasted onto a white background.
- Not-food images and unseen fruits still get an answer.