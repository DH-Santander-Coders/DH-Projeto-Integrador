const { Usuario } = require('../models');
const { compararHashDaSenha } = require('../utils/hashing');
const { gerarHashDaSenha } = require('../utils/hashing');
const { validationResult } = require("express-validator")

const index = (req, res) => {
    return res.render('configuracao-conta', { title: "Configuração", css: "style-configuracao-conta.css" });

}

const update = async (req, res) => {

    const { novoNickname, novoEmail, novaSenha, senhaAtual } = req.body;
    const { senha } = req.session.usuario;
    let dadosValidacao = [];
    
    if (await compararHashDaSenha(senhaAtual, senha)) {

        const erros = validationResult(req);
        
        if (!erros.isEmpty()) {
            
            const {errors: [...listaErros]} = erros

            return res.render('configuracao-conta',
                {
                    title: "Configuração",
                    css: "style-configuracao-conta.css",
                    dadosValidacao: listaErros
                });
        }

        const { id } = req.session.usuario;
        const usuarioLogado = await Usuario.findByPk(id);

        // Verifica se nickname já existe no banco
        const nickname = await Usuario.findOne({
            where: { nickname: novoNickname }
        })
        // Verifica se email já existe no banco
        const email = await Usuario.findOne({
            where: { email: novoEmail }
        })

        // verifica se existe e se campo não veio vazio e faz a troca do nickname
        if (!nickname && novoNickname !== "") {
            console.log(nickname)
            usuarioLogado.nickname = novoNickname;
            await usuarioLogado.save();
            dadosValidacao.push({ msg: "Nickname alterado com sucesso" });
        } else if (nickname) {
            console.log(nickname)
            dadosValidacao.push({ msg: "Nickname já existe !" });
        }

        // verifica se existe e se campo não veio vazio e faz a troca do email
        if (!email && novoEmail !== "") {
            usuarioLogado.email = novoEmail;
            await usuarioLogado.save();
            dadosValidacao.push({ msg: "Email alterado com sucesso" });
        } else if (email) {
            dadosValidacao.push({ msg: "Email já existe !" });
        }

        // verifica se existe e se campo não veio vazio e se tem mais de 3 caracteres e faz a troca da senha
        if (novaSenha) {
            usuarioLogado.senha = await gerarHashDaSenha(novaSenha);
            await usuarioLogado.save();
            dadosValidacao.push({ msg: "Senha alterada com sucesso" });
        }

        if (!dadosValidacao) {
            return res.redirect('/configuracao/usuario');
        }

        req.session.usuario = usuarioLogado;

        return res.render('configuracao-conta',
            {
                title: "Configuração",
                css: "style-configuracao-conta.css",
                dadosValidacao
            });

    } else {
        dadosValidacao.push({ msg: "Senha incorreta, tente novamente!" });
        return res.render('configuracao-conta',
            {
                title: "Configuração",
                css: "style-configuracao-conta.css",
                dadosValidacao
            });
    }
}


const destroy = async (req, res) => {


    const { senhaAtual } = req.body;
    const { senha } = req.session.usuario;

    let dadosValidacao = [];

    if (await compararHashDaSenha(senhaAtual, senha)) {
        const { id } = req.session.usuario;
        Usuario.destroy({
            where: { id: id }
        })
        return res.redirect('/')

    } else {
        dadosValidacao.push({ msg: "Senha incorreta, tente novamente!" });
        return res.render('configuracao-conta',
            {
                title: "Configuração",
                css: "style-configuracao-conta.css",
                dadosValidacao
            });
    }
}

module.exports = { index, update, destroy }