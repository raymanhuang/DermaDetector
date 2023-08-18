import torch
from sklearn.metrics import f1_score

def train_step(model, data_loader, loss_fn, optimizer, device):
    model.train()
    total_loss = 0.0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in data_loader:
            inputs, labels = inputs.to(device), labels.to(device)

            optimizer.zero_grad()

            outputs = model(inputs)
            loss = loss_fn(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(data_loader.dataset)
    f1 = f1_score(all_labels, all_preds, average='macro')

    return avg_loss, f1

def test_step(model, data_loader, loss_fn, device):
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for inputs, labels in data_loader:
            inputs, labels = inputs.to(device), labels.to(device)

            outputs = model(inputs)
            loss = loss_fn(outputs, labels)

            total_loss += loss.item() * inputs.size(0)

            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(data_loader.dataset)
    f1 = f1_score(all_labels, all_preds, average='macro')

    return avg_loss, f1


def train(model, train_loader, test_loader, loss_fn, optimizer, device, epochs):
    for epoch in range(epochs):
        train_loss, train_f1 = train_step(model, train_loader, loss_fn, optimizer, device)
        test_loss, test_f1 = test_step(model, test_loader, loss_fn, device)

        print(f"Epoch {epoch + 1}/{epochs} => "
              f"Train loss: {train_loss:.4f}, Train F1: {train_f1:.4f}, "
              f"Test loss: {test_loss:.4f}, Test F1: {test_f1:.4f}")