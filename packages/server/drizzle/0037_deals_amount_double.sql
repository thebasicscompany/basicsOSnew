-- Allow fractional deal amounts (currency UI sends dollars with decimals; bigint rejected non-integers).
ALTER TABLE "deals" ALTER COLUMN "amount" TYPE double precision USING "amount"::double precision;
