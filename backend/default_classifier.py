import joblib
import pandas as pd
import shap
from lime.lime_tabular import LimeTabularExplainer
from pathlib import Path


MODEL_PATH = Path(r"C:\Users\linam\OneDrive\Desktop\final_project\backend\best_model.pkl")
FEATURES_PATH = Path(r"C:\Users\linam\OneDrive\Desktop\final_project\backend\feature_columns.pkl")
BACKGROUND_PATH = Path(r"C:\Users\linam\OneDrive\Desktop\final_project\backend\background_sample.pkl")


model = joblib.load(MODEL_PATH)
feature_columns = joblib.load(FEATURES_PATH)
background_data = joblib.load(BACKGROUND_PATH)


explainer_lime = LimeTabularExplainer(
    training_data=background_data.values,
    feature_names=feature_columns,
    class_names=["No Default", "Default"],
    mode="classification"
)


stacking_clf = model.named_steps["clf"]


explainer_meta = shap.TreeExplainer(stacking_clf.final_estimator_)


explainer_rf = shap.TreeExplainer(stacking_clf.named_estimators_["rf"])
explainer_xgb = shap.TreeExplainer(stacking_clf.named_estimators_["xgb"])
explainer_dt = shap.TreeExplainer(stacking_clf.named_estimators_["dt"])
explainer_gb = shap.TreeExplainer(stacking_clf.named_estimators_["gb"])
explainer_logreg = shap.LinearExplainer(stacking_clf.named_estimators_["logreg"], background_data)
explainer_svm = shap.KernelExplainer(stacking_clf.named_estimators_["svm"].predict_proba, background_data)
explainer_knn = shap.KernelExplainer(stacking_clf.named_estimators_["knn"].predict_proba, background_data)
explainer_nb = shap.KernelExplainer(stacking_clf.named_estimators_["nb"].predict_proba, background_data)

def collapse_one_hot_explanations(explanation, features):
    """
    Collapse one-hot encoded categorical features into a single entry
    showing only the active category (dummy = 1).
    """
    collapsed = []
    seen_bases = set()

    for e in explanation:
        feat = e["feature"]

        if "_" in feat:  
            base, category = feat.split("_", 1)           
            feat_clean = feat.split(" ")[0]  
            if features.get(feat_clean, 0) == 1 and base not in seen_bases:
                collapsed.append({
                    "feature": f"{base}: {category.replace('> 0.00','').replace('<= 0.00','')}",
                    "impact": e["impact"]
                })
                seen_bases.add(base)
        else:
            collapsed.append(e)

    return collapsed


def predict(features: dict, top_n: int = 3, method: str = "lime"):
    """
    Predicts the probability of default using the trained pipeline
    and explains the prediction using LIME or SHAP.
    """
    X = pd.DataFrame([features])
    X = X.reindex(columns=feature_columns, fill_value=0) 

    pred = int(model.predict(X)[0])
    prob_default = float(model.predict_proba(X)[0][1])
    risk_label = "High Risk (Likely to Default)" if pred == 1 else "Low Risk (Likely to Repay)"

    explanation = []

    if method == "lime":
        exp = explainer_lime.explain_instance(
            data_row=X.values[0],
            predict_fn=model.predict_proba,
            num_features=top_n
        )
        explanation = [{"feature": f, "impact": round(float(val), 4)} for f, val in exp.as_list()]
        print("LIME explanation:", exp.as_list())


    elif method == "shap_meta":
        shap_values = explainer_meta.shap_values(X[feature_columns])
        shap_row = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        base_model_names = list(stacking_clf.named_estimators_.keys())
        explanation = sorted(
            [{"model": name, "impact": round(float(val), 4)} for name, val in zip(base_model_names, shap_row)],
            key=lambda x: abs(x["impact"]),
            reverse=True
        )[:top_n]
       

    elif method.startswith("shap_"):
        model_key = method.split("_", 1)[1]
        base_model = stacking_clf.named_estimators_[model_key]

        if model_key in ["rf", "xgb", "dt", "gb"]:
            explainer = shap.TreeExplainer(base_model)
            shap_values = explainer.shap_values(X[feature_columns])
            shap_row = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        else:
            explainer = shap.KernelExplainer(base_model.predict_proba, background_data)
            shap_row = explainer.shap_values(X[feature_columns], nsamples=50)[1][0]  # ✅ limited nsamples

        feature_importance = sorted(
            zip(feature_columns, shap_row),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        explanation = [{"feature": f, "impact": round(float(val), 4)} for f, val in feature_importance[:top_n]]
        
    if explanation and "feature" in explanation[0]:
        filtered_explanation = collapse_one_hot_explanations(explanation, features)
    else:
        filtered_explanation = explanation
    print("filtered explanation:",filtered_explanation)

    return {
        "features":features,
        "risk_score": round(prob_default, 4),
        "probability_of_default": prob_default,
        "risk_label": risk_label,
        "explanation": filtered_explanation,
        "top_factors": [
            {"name": e.get("feature") or e.get("model"), "value": e["impact"]}
           for e in filtered_explanation
        ]
    }

