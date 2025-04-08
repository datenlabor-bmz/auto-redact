#! /usr/bin/env uv run docs/ifg_stats.py
# /// script
# dependencies = [
#   "requests",
#   "joblib",
#   "rich",
#   "pandas",
#   "altair",
#   "vl-convert-python",
# ]
# ///

import re

import altair as alt
import pandas as pd
from joblib.memory import Memory
from requests import get
from rich import print
from rich.progress import track

memory = Memory(location=".cache", verbose=0)
get = memory.cache(get)


def get_federal_ministry(q):
    return get("https://fragdenstaat.de/api/v1/publicbody/", params={"q": q}).json()[
        "objects"
    ]


federal_ministries = get_federal_ministry("Bundesministerium")
federal_ministries = [
    fm for fm in federal_ministries if fm["name"].startswith("Bundesministerium")
]
federal_ministries += get_federal_ministry("Bundeskanzleramt")
federal_ministries += get_federal_ministry("Auswärtiges Amt")


def count_requests(ministry, year):
    requests = get(
        "https://fragdenstaat.de/api/v1/request/",
        params={
            "public_body": ministry["id"],
            "created_at_after": f"{year}-01-01",
            "created_at_before": f"{year}-12-31",
        },
    ).json()["meta"]
    return requests["total_count"]


def slug(ministry):
    return ministry["other_names"].split(",")[0]


requests = pd.DataFrame(
    [
        (slug(ministry), year, count_requests(ministry, year))
        for ministry in federal_ministries
        for year in range(2010, 2025)
    ],
    columns=["ministry", "year", "requests"],
)

# make chart with timeline for each ministry
chart_by_ministry = (
    alt.Chart(requests)
    .mark_bar()
    .encode(
        x="year:O",
        y=alt.Y("requests:Q", axis=alt.Axis(title=None)),
        tooltip=["ministry", "year", "requests"],
    )
    .properties(
        height=70,
        width=400,
    )
    .facet(
        row="ministry:N",
        align="each",
    )
    .interactive()
)

# make chart with timeline overall
chart_overall = (
    alt.Chart(requests)
    .mark_bar()
    .encode(
        x="year:O",
        y="sum(requests):Q",
        tooltip=alt.Tooltip(field="requests", aggregate="sum"),
    )
    .properties(
        height=200,
        width=400,
    )
)
chart = alt.vconcat(chart_overall, chart_by_ministry)
chart.save("docs/relevance/ifg_requests_timeline.svg")


def retrieve_requests(ministry, year, offset=0):
    limit = 50
    requests = get(
        "https://fragdenstaat.de/api/v1/request/",
        params={
            "public_body": ministry["id"],
            "created_at_after": f"{year}-01-01",
            "created_at_before": f"{year}-12-31",
            "limit": limit,
            "offset": offset,
        },
    ).json()
    if offset + len(requests["objects"]) < requests["meta"]["total_count"]:
        return requests["objects"] + retrieve_requests(ministry, year, offset + limit)
    else:
        return requests["objects"]


def retrieve_attachment_data(request_id):
    request = get(
        f"https://fragdenstaat.de/api/v1/request/{request_id}/",
    ).json()
    attachments = [m["attachments"] for m in request["messages"] if m["is_response"]]
    return [
        a
        for alist in attachments
        for a in alist
        if a["is_pdf"]
        and not re.search(
            r"bescheid|schreiben|antwort|datenschutz|ifg|eingang", a["name"].lower()
        )
    ]


attachments = []
for ministry in federal_ministries[:2]:
    requests = retrieve_requests(ministry, 2024)
    for request in track(
        requests, description=f"Retrieving attachments for {slug(ministry)}"
    ):
        attachments.append(retrieve_attachment_data(request["id"]))
        # print([a["site_url"] for a in retrieve_attachment_data(request["id"])])

lengths = pd.DataFrame([len(a) for a in attachments], columns=["length"])

# make a histogram of the number of attachments
hist = (
    alt.Chart(lengths)
    .mark_bar()
    .encode(alt.X("length:Q", bin=alt.Bin(step=1)), y="count()")
    .properties(width=400, height=200)
)
hist.save("docs/relevance/ifg_attachments_histogram.svg")

print(f"Average number of attachments per request: {lengths['length'].mean(): .2f}")
print(
    f"Proportion of requests with no attachments: {lengths[lengths['length'] == 0].shape[0] / len(lengths): .2f}"
)
