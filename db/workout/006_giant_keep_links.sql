-- Giant order lines pulled from the Google Keep "Giant" list. pending: on the
-- open list; added: in the Giant cart, checked in Keep once the order is placed.
CREATE TABLE giant_keep_links (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  note_id text NOT NULL,
  item_id text NOT NULL,
  text text NOT NULL,
  -- lowercased name without its quantity, as giant-cart parses list lines
  match_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'added')),
  created_at timestamptz NOT NULL DEFAULT now()
);
