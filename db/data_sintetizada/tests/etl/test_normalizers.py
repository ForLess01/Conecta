import pandas as pd

from src.etl.normalizers import normalize_frame

ALIASES = {
    "products": {"granada": "Granada", "granada wonderful": "Granada"},
    "varieties": {"wonderful": "Wonderful"},
    "markets": {"m. mayorista de frutas": "Mercado Mayorista de Frutas"},
    "departments": {"ica": "Ica"},
    "provinces": {"ica": "Ica"},
}


def test_normalize_products() -> None:
    df = pd.DataFrame({"product": ["GRANADA", "Granada Wonderful"], "variety": ["wonderful", "Wonderful"]})
    normalized = normalize_frame("market_prices", df, ALIASES)
    assert normalized["product"].tolist() == ["Granada", "Granada"]


def test_normalize_markets() -> None:
    df = pd.DataFrame({"market": ["M. Mayorista de Frutas"]})
    normalized = normalize_frame("market_prices", df, ALIASES)
    assert normalized["market"].tolist() == ["Mercado Mayorista de Frutas"]
