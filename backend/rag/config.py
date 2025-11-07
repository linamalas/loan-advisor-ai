from pathlib import Path


DOC_PATHS=[
    Path("documents/965a_fixing_your_credit_aug2022_508.pdf"),
    Path("documents/1053a_improvingyourcredit-508.pdf"),
    Path("documents/201503_cfpb_your-home-loan-toolkit-web.pdf"),
    Path("documents/cfpb_adult-fin-ed_understand-your-credit-score.pdf"),
    Path("documents/pdf-0034-credit-repair.pdf"),
    Path("documents/pdf-0070-credit-and-your-consumer-rights_1.pdf"),
    Path("documents/what-your-credit-report-says-about-you.pdf"),
]
VECTOR_DIR=Path("./vectorstore")
VECTOR_DIR.mkdir(parents=True,exist_ok=True)
